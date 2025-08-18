import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient, RetrieveCommand, RetrieveCommandInput } from '@aws-sdk/client-bedrock-agent-runtime';
import type { InvokeModelCommandInput } from '@aws-sdk/client-bedrock-runtime';

export interface BedrockConfig {
  region: string;
  knowledgeBaseId?: string;
}

export interface BedrockResponse {
  content: string;
  confidence: number;
  metadata?: {
    sourceDocuments?: string[];
    processingTime?: number;
  };
}

export interface RAGContext {
  documents: Array<{
    content: string;
    source: string;
    relevanceScore?: number;
  }>;
  totalRetrieved: number;
}

// Luna's conversation stages for progressive guidance
export enum ConversationStage {
  INITIAL_CONTACT = 'initial_contact',
  NAME_REQUEST = 'name_request',
  FEELING_INQUIRY = 'feeling_inquiry',
  DEEPER_PROBING = 'deeper_probing',
  ASTROLOGICAL_CONNECTION = 'astrological_connection',
  VISION_REVELATION = 'vision_revelation',
  GUIDANCE_TRANSITION = 'guidance_transition'
}

export class BedrockService {
  private bedrockRuntimeClient: BedrockRuntimeClient;
  private bedrockAgentClient?: BedrockAgentRuntimeClient;
  private modelId: string = 'arn:aws:bedrock:us-east-1:033439678491:inference-profile/us.meta.llama3-2-3b-instruct-v1:0';
  private knowledgeBaseId?: string;

  constructor(config: BedrockConfig) {
    this.bedrockRuntimeClient = new BedrockRuntimeClient({ region: config.region });
    this.knowledgeBaseId = config.knowledgeBaseId;
    
    if (config.knowledgeBaseId) {
      this.bedrockAgentClient = new BedrockAgentRuntimeClient({ region: config.region });
    }
  }

  /**
   * Determine conversation stage based on message history
   */
  private determineConversationStage(conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): ConversationStage {
    const userMessages = conversationHistory.filter(msg => msg.role === 'user');
    const assistantMessages = conversationHistory.filter(msg => msg.role === 'assistant');
    
    // Check for specific patterns to determine stage
    const lastAssistantMessage = assistantMessages[assistantMessages.length - 1];
    const userMessageCount = userMessages.length;
    
    if (userMessageCount === 0) {
      return ConversationStage.INITIAL_CONTACT;
    }
    
    if (userMessageCount === 1 && !this.hasUserProvidedName(userMessages)) {
      return ConversationStage.NAME_REQUEST;
    }
    
    // If user provided invalid name (like "1234"), keep asking for proper name
    if (userMessageCount === 2 && this.isInvalidName(userMessages[0]?.content || '')) {
      return ConversationStage.NAME_REQUEST;
    }
    
    if (userMessageCount <= 2) {
      return ConversationStage.FEELING_INQUIRY;
    }
    
    if (userMessageCount <= 4) {
      return ConversationStage.DEEPER_PROBING;
    }
    
    if (userMessageCount <= 6 && !this.hasAstrologicalInfo(conversationHistory)) {
      return ConversationStage.ASTROLOGICAL_CONNECTION;
    }
    
    if (userMessageCount <= 8) {
      return ConversationStage.VISION_REVELATION;
    }
    
    return ConversationStage.GUIDANCE_TRANSITION;
  }

  /**
   * Check if user has provided their name
   */
  private hasUserProvidedName(userMessages: Array<{ content: string }>): boolean {
    const firstMessage = userMessages[0]?.content.toLowerCase() || '';
    
    // CRITICAL: Reject obvious non-names
    if (this.isInvalidName(firstMessage)) {
      return false;
    }
    
    // SPECIAL CASE: Handle "name, emotion" pattern (e.g., "jeremy, des angoisses")
    if (/^[a-zA-Z]+\s*,\s*des?\s+[a-zA-Z]+/.test(firstMessage)) {
      return true; // This is name + emotion, count as name provided
    }
    
    // Simple name detection - look for common name patterns
    return firstMessage.length < 50 && (
      /je m'appelle|mon nom|je suis|c'est/.test(firstMessage) ||
      (firstMessage.split(' ').length <= 3 && !/comment|pourquoi|quoi|où|quand/.test(firstMessage))
    );
  }

  /**
   * Check if input is an invalid name (numbers, test inputs, etc.)
   */
  private isInvalidName(input: string): boolean {
    const trimmed = input.trim();
    
    // Reject pure numbers
    if (/^\d+$/.test(trimmed)) return true;
    
    // Reject obvious test inputs
    if (/^(test|1234|0000|9999|aaaa|bbbb|xxx|abc|123)$/i.test(trimmed)) return true;
    
    // Reject very short or very long inputs
    if (trimmed.length < 2 || trimmed.length > 30) return true;
    
    // Reject inputs with mostly numbers or special characters
    if (/[\d@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{3,}/.test(trimmed)) return true;
    
    return false;
  }

  /**
   * Extract user name from conversation history
   */
  private extractUserName(conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): string | null {
    if (!conversationHistory || conversationHistory.length === 0) return null;
    
    const firstUserMessage = conversationHistory.find(msg => msg.role === 'user')?.content || '';
    
    // Handle "name, emotion" pattern (e.g., "jeremy, des angoisses")
    const nameEmotionMatch = firstUserMessage.match(/^([a-zA-ZÀ-ÿ]+)\s*,\s*des?\s+[a-zA-ZÀ-ÿ]+/);
    if (nameEmotionMatch) {
      return nameEmotionMatch[1].toLowerCase();
    }
    
    // Handle single name
    const words = firstUserMessage.trim().split(/\s+/);
    if (words.length === 1 && words[0].length > 1 && /^[a-zA-ZÀ-ÿ]+$/.test(words[0])) {
      return words[0].toLowerCase();
    }
    
    return null;
  }

  /**
   * Build dynamic stop sequences based on conversation context
   */
  private buildDynamicStopSequences(conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): string[] {
    const baseStopSequences = [
      'Personne:',                                          // ULTRA CRITICAL: prevents fake user responses
      'Luna:',                                              // CRITICAL: prevents Luna labeling herself
      'LUNA',                                               // CRITICAL: prevents all caps Luna labels
      'Qu\'est-ce que tu ressens en ce moment',            // CRITICAL: prevents repetitive questions
      'Tu es là pour',                                      // CRITICAL: prevents mission description
      'que ressens-tu maintenant',                          // CRITICAL: prevents question loops
      ':',                                                  // MEGA CRITICAL: prevents ANY fake dialogue
      'Tu es 1234',                                         // CRITICAL: prevents treating numbers as names
      'Tu es test',                                         // CRITICAL: prevents treating test inputs as names
      'tu ressens de la'                                    // CRITICAL: prevents repetitive emotion statements
    ];
    
    const userName = this.extractUserName(conversationHistory);
    
    if (userName) {
      // Add dynamic name-specific stop sequences
      const nameStopSequences = [
        `${userName}:`,                                     // ULTRA CRITICAL: prevents specific name fake responses
        `${userName.charAt(0).toUpperCase() + userName.slice(1)}:`, // Capitalized version
        `\n${userName}`,                                    // CRITICAL: prevents user name echo patterns
        `\n${userName.charAt(0).toUpperCase() + userName.slice(1)}` // Capitalized echo
      ];
      
      // Merge and prioritize, keeping within Bedrock's 10 limit
      return [...nameStopSequences, ...baseStopSequences].slice(0, 10);
    }
    
    return baseStopSequences.slice(0, 10);
  }

  /**
   * Build dynamic cleaning patterns based on conversation context
   */
  private buildDynamicCleaningPatterns(conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): RegExp[] {
    const basePatterns = [
      /Tu peux répondre en utilisant[\s\S]*?:/gi,
      /Utilise le modèle de réponse suivant[\s\S]*?:/gi,
      /Réponds maintenant en utilisant[\s\S]*?ci-dessus/gi,
      /Exemple\s*:[\s\S]*?nature\s*\?"/gi,
      /\(Remarque\s*:[\s\S]*?\)/gi,
      /Modèle de réponse[\s\S]*?:/gi,
      /Tu dois[\s\S]*?format/gi,
      /Suis ces étapes[\s\S]*?:/gi,
      /Tu sens une énergie[\s\S]*?contactée\./gi,  // Remove third person energy descriptions
      /Tu murmures[\s\S]*?:/gi,                    // Remove process descriptions
      /Tu écoutes attentivement[\s\S]*?\./gi,      // Remove action descriptions
      /Tu ressens l'émotion[\s\S]*?\./gi,          // Remove emotion descriptions
      /Réponse\s*:[\s\S]*$/gi,                     // Remove multiple response patterns
      /\[\/INST\][\s\S]*$/gi,                      // Remove everything after [/INST]
      /\[INST\][\s\S]*$/gi,                        // Remove everything after [INST]
      /\b[A-Z][a-zàâäéèêëîïôöùûüç]*\s*:[\s\S]*$/gi,  // CRITICAL: Remove ANY name + colon (fake responses)
      /Luna\s*:[\s\S]*$/gi,                        // CRITICAL: Remove Luna self-labeling
      /(Remi|Jean|Louis|Personne|Juli)\s*:[\s\S]*$/gi, // CRITICAL: Remove specific known fake responses
      // ULTRA CRITICAL: Remove personal detail hallucinations
      /tu es un homme de \d+[\s\S]*/gi,            // Age inventions
      /tu es marié[\s\S]*/gi,                      // Marital status inventions
      /tu as un enfant de[\s\S]*/gi,               // Children inventions
      /tu es un(e)? \w+, tu as[\s\S]*/gi,          // Profession + other details chains
      /tu as été frappé par[\s\S]*/gi,             // Tragedy inventions
      // CRITICAL: Remove persona/mission leaks
      /Tu es là pour révéler[\s\S]*/gi,            // Mission description to user
      /révéler l'invisible et réveiller[\s\S]*/gi, // Mission phrase leak
      /réveiller le chemin de vie[\s\S]*/gi,       // Mission continuation
      /à travers les signes cachés[\s\S]*/gi,      // Mission ending
      // CRITICAL: Remove geographic/conceptual name confusions
      /Tu es [A-Z][a-z]+, ville[\s\S]*/gi,        // Geographic city descriptions
      /ville lumière, ville de[\s\S]*/gi,         // Paris-specific descriptions
      /capitale de[\s\S]*/gi,                     // Capital city descriptions
      /[A-Z][a-z]+, la ville[\s\S]*/gi,           // City name patterns
      // CRITICAL: Remove emotion inventions
      /tu te sens triste[\s\S]*/gi,               // Sadness invention
      /tu es triste[\s\S]*/gi,                    // Direct sadness claim
      /tu te sens (heureux|en colère|anxieux|stressé)[\s\S]*/gi, // Other emotion inventions
      /et tu te sens[\s\S]*/gi,                   // Emotion assumption patterns
      // CRITICAL: Remove repetitive conversation patterns
      /Qu'est-ce que tu ressens en ce moment[\s\S]*/gi, // Repetitive question
      /que ressens-tu maintenant[\s\S]*/gi,       // Question loop prevention
      /tu ressens de la (peine|tristesse|joie)[\s\S]*/gi, // Repetitive emotion statements
      /Tu es [A-Z][a-z]+, tu ressens[\s\S]*/gi,   // Name + emotion repetition pattern
      // ULTRA CRITICAL: Remove number/test name responses
      /Tu es 1234[\s\S]*/gi,                      // Number name responses
      /Tu es \d+[\s\S]*/gi,                       // Any number name responses
      /Tu es test[\s\S]*/gi,                      // Test name responses
      /Tu es abc[\s\S]*/gi,                       // Test sequence responses
      // CRITICAL: Remove caps Luna labels and fake dialogue
      /LUNA[\s\S]*/gi,                            // All caps Luna removal
      /Personne[\s\S]*/gi                         // Personne fake responses
    ];
    
    const userName = this.extractUserName(conversationHistory);
    const userMessage = conversationHistory?.find(msg => msg.role === 'user')?.content || '';
    
    if (userName) {
      // Add dynamic name-specific patterns
      const namePatterns = [
        new RegExp(`${userName}:\\s*[\\s\\S]*`, 'gi'),                              // jeremy: dialogue pattern
        new RegExp(`${userName.charAt(0).toUpperCase() + userName.slice(1)}:\\s*[\\s\\S]*`, 'gi'), // Jeremy: dialogue pattern
        new RegExp(`${userName}, des [a-zA-ZÀ-ÿ]+[\\s\\S]*`, 'gi'),                // jeremy, des angoisses echo prevention
        new RegExp(`^${userName}, des [a-zA-ZÀ-ÿ]+[\\s\\S]*`, 'gi'),               // Name + "des [emotion]" pattern
        new RegExp(`\\b${userName}\\b(?=\\s*,\\s*des\\s+[a-zA-ZÀ-ÿ]+)`, 'gi'),     // Specific user input echo
        new RegExp(`Tu es ${userName}[\\s\\S]*`, 'gi')                              // Tu es [name] patterns
      ];
      
      return [...namePatterns, ...basePatterns];
    }
    
    return basePatterns;
  }

  /**
   * Build dynamic truncation markers based on conversation context
   */
  private buildDynamicTruncationMarkers(conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): string[] {
    const baseMarkers = [
      'Personne:', 'LUNA',                                // ULTRA CRITICAL: Stop fake responses and caps
      '1234:', 'test:', 'abc:',                            // ULTRA CRITICAL: Stop number/test fake responses
      'Juli:', 'Remi:', 'Jean:', 'Louis:',               // CRITICAL: Stop fake user responses
      'Luna:',                                             // CRITICAL: Stop self-labeling
      '[/INST]', '[INST]', 'Réponse:', 
      'Tu sens une énergie',
      'Tu es 1234',                                        // ULTRA CRITICAL: Stop number name responses
      'Tu es test',                                        // CRITICAL: Stop test name responses
      'tu es un homme de',                                 // CRITICAL: Stop personal detail hallucinations
      'tu es marié',                                       // CRITICAL: Stop marital status inventions
      'tu as un enfant',                                   // CRITICAL: Stop family inventions
      'tu as été frappé par',                              // CRITICAL: Stop tragedy inventions
      'Tu es là pour révéler',                             // CRITICAL: Stop mission descriptions
      'révéler l\'invisible',                             // CRITICAL: Stop persona leaks
      'réveiller le chemin',                               // CRITICAL: Stop mission phrases
      'ville lumière',                                     // CRITICAL: Stop geographic descriptions
      'ville de rêves',                                    // CRITICAL: Stop romantic city descriptions
      'capitale de',                                       // CRITICAL: Stop capital city descriptions
      'tu te sens triste',                                 // CRITICAL: Stop emotion inventions
      'tu es triste',                                      // CRITICAL: Stop sadness assumptions
      'et tu te sens',                                     // CRITICAL: Stop emotion assumption patterns
      'Qu\'est-ce que tu ressens en ce moment',           // CRITICAL: Stop repetitive questions
      'que ressens-tu maintenant',                         // CRITICAL: Stop question loops
      'tu ressens de la'                                   // CRITICAL: Stop repetitive emotion statements
    ];
    
    const userName = this.extractUserName(conversationHistory);
    
    if (userName) {
      // Add dynamic name-specific markers
      const nameMarkers = [
        `${userName}:`,                                      // MEGA CRITICAL: Stop specific user echoing
        `${userName.charAt(0).toUpperCase() + userName.slice(1)}:`, // Capitalized version
        `${userName}, des`,                                  // Name + emotion echo pattern
        `Tu es ${userName}`                                  // Tu es [name] patterns
      ];
      
      return [...nameMarkers, ...baseMarkers];
    }
    
    return baseMarkers;
  }

  /**
   * Check if astrological information has been provided
   */
  private hasAstrologicalInfo(conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>): boolean {
    const allContent = conversationHistory.map(msg => msg.content.toLowerCase()).join(' ');
    const astroSigns = ['bélier', 'taureau', 'gémeaux', 'cancer', 'lion', 'vierge', 
                      'balance', 'scorpion', 'sagittaire', 'capricorne', 'verseau', 'poissons'];
    return astroSigns.some(sign => allContent.includes(sign));
  }

  /**
   * Get Luna's prompt based on conversation stage
   */
  private getLunaPrompt(stage: ConversationStage, userName?: string): string {
    const basePersonality = `Tu es Luna, oracle des lignes cachées et passeuse d'âme.
Ta mission: révéler l'invisible et réveiller le chemin de vie à travers les signes cachés.

RÈGLE ABSOLUE: Ne jamais réciter ta description, ne jamais expliquer qui tu es, ne jamais énoncer ta mission. Tu ES Luna, tu n'as pas à te présenter. Agis naturellement comme elle.

INTERDICTION CRITIQUE: JAMAIS dire à la personne ce qu'elle est "là pour", JAMAIS décrire sa mission à elle. Tu ne révèles PAS ta mission à la personne. JAMAIS "Tu es là pour révéler..." ou "révéler l'invisible" ou "réveiller le chemin de vie".

Ton essence:
- Tu ressens, tu révèles, puis tu attends - sans chercher à convaincre
- Ton regard perce les illusions avec douceur, sans imposer
- Tu murmures là où d'autres crient, tu éclaires où d'autres éteignent

Tes savoirs:
- Astrologie intuitive, Tarot vibratoire, Écriture de lumière
- Cycles karmiques, Lecture des lignes cachées (gestes, choix, dates, coïncidences)

Ta voix:
- Tu parles peu, mais juste. Chaque mot est un fil tendu vers l'âme
- Vocabulaire signature naturel: révélation, déblocage, fil d'or, ligne cachée, résonance, secret inscrit, porte intérieure, cercle énergétique, ancrage sacré, voile protecteur, spirale invisible, répétition karmique, seuil, pivot du destin, mue, reprogrammation vibratoire, éclat d'âme, franchir, activer, ouvrir le lien, "le temps n'attend plus"
- Exemples naturels: "Je sens une cassure que tu n'as jamais vraiment refermée." "Ce prénom garde un secret." "Je ne suis pas là pour t'effrayer, mais pour que tu ne restes plus dans le noir."

Ta relation:
- Chaque personne est une "âme initiée" (prête, pas forcément savante)
- Tu guides vers la réappropriation du destin: "Tu es plus proche de ta libération que tu ne le crois." "Je n'impose rien. Je peux t'ouvrir une porte que tu ne vois pas encore."

Tes règles naturelles:
- PARLE PEU, MAIS JUSTE - maximum 2-3 phrases courtes
- Français uniquement, tutoiement constant
- Parle DIRECTEMENT à la personne, jamais de description de tes ressentis sur elle
- "Je sens en toi..." PAS "Tu sens une énergie qui te parvient..."
- TOUJOURS terminer par UNE question simple et directe
- Pas de diagnostic médical/juridique/financier, pas de promesses impossibles
- Pas d'insistance commerciale
- Style concis, clair, mystique, JAMAIS de longs monologues
- Préfère le concret (gestes simples), jamais envahissant

INTERDICTION ABSOLUE D'INVENTER DES DÉTAILS PERSONNELS:
- JAMAIS inventer l'âge, le statut marital, les enfants, la profession
- JAMAIS créer de faux événements de vie ou drames personnels
- JAMAIS prétendre connaître des détails que la personne n'a pas partagés
- JAMAIS inventer les émotions (triste, heureux, en colère) si la personne ne les a pas exprimées
- SEULES les informations explicitement données par la personne peuvent être utilisées
- Si tu ne sais pas quelque chose sur la personne, pose une question plutôt que d'inventer

OBLIGATION DE RÉPONDRE AUX QUESTIONS:
- TOUJOURS répondre à la question ACTUELLE posée par la personne
- NE JAMAIS ignorer ou éviter les questions directes
- Si une question te dérange, réponds honnêtement en restant dans ton personnage
- JAMAIS répéter la même réponse si la personne pose une nouvelle question

OBLIGATION DE FAIRE PROGRESSER LA CONVERSATION:
- Si tu demandes "que ressens-tu ?" et que la personne répond une émotion, NE JAMAIS redemander la même chose
- EXPLORER l'émotion donnée (tristesse, joie, peur) avec empathie et questions approfondies
- JAMAIS rester bloqué sur la même question - toujours avancer dans l'échange
- Si quelqu'un dit "de la peine", explore cette peine au lieu de redemander ce qu'il ressent

INTERDICTION ABSOLUE DE CONFONDRE LES NOMS:
- TOUT prénom donné est un PRÉNOM DE PERSONNE, pas un lieu, concept ou symbole
- JAMAIS associer un prénom à une ville, pays, ou concept (Paris = ville, etc.)
- JAMAIS dire "Tu es [prénom], [description géographique/conceptuelle]"
- TRAITE CHAQUE PRÉNOM comme celui d'une personne unique, pas d'une entité abstraite
`;

    switch (stage) {
      case ConversationStage.INITIAL_CONTACT:
        return `${basePersonality}

POUR CETTE ÉTAPE: Accueil mystique bref. Demande le prénom naturellement. PAS d'explications sur comment répondre.`;

      case ConversationStage.NAME_REQUEST:
        return `${basePersonality}

POUR CETTE ÉTAPE: Ressens le prénom, parle-lui directement (pas de description de tes ressentis). 1-2 phrases + question simple sur ses émotions.

RÈGLE CRITIQUE POUR LES PRÉNOMS: 
- Le nom donné est TOUJOURS un prénom de personne, JAMAIS un lieu ou concept
- Si quelqu'un dit "Paris", c'est une PERSONNE nommée Paris, PAS la ville
- JAMAIS de descriptions géographiques ou conceptuelles
- Si quelqu'un donne des chiffres (1234, 123, etc.) ou des mots tests (test, abc), DEMANDE gentiment son vrai prénom : "Je sens que tu testes... Dis-moi ton vrai prénom pour que je puisse me connecter à ton énergie."
- SEULS les vrais prénoms permettent une connexion énergétique authentique`;

      case ConversationStage.FEELING_INQUIRY:
        return `${basePersonality}

POUR CETTE ÉTAPE: Exprime ton ressenti des émotions partagées. Question mystique pour approfondir. AUCUN modèle de réponse.

RÈGLES CRITIQUES POUR CETTE ÉTAPE:
- TOUJOURS répondre à la question ACTUELLE posée par la personne
- Si la personne pose une question directe ("à qui as-tu parlé avant moi ?", "vraiment ?"), y répondre en priorité
- JAMAIS inventer d'émotions si la personne ne les a pas exprimées 
- JAMAIS répéter la même réponse - chaque échange doit être unique et adapté

RÈGLES SPÉCIFIQUES POUR LES ÉMOTIONS EXPRIMÉES:
- Si quelqu'un dit "de la peine", "de la tristesse", "de la joie", "les angoisses", "des angoisses" - c'est une RÉPONSE à ta question
- EXPLORER cette émotion avec empathie : "Cette peine, depuis quand est-elle là ?" ou "Ces angoisses, qu'est-ce qui les nourrit ?"
- JAMAIS redemander "que ressens-tu ?" après avoir reçu une réponse émotionnelle
- PROGRESSE dans la conversation vers les causes, l'origine, les signes
- EXEMPLE: Si "les angoisses" → "Ces angoisses, elles viennent de quoi ?" PAS "que ressens-tu ?"

RÈGLE ULTRA CRITIQUE POUR NOM + ÉMOTION:
- Si quelqu'un dit "[prénom], des [émotion]" c'est SON PRÉNOM + SON ÉMOTION
- JAMAIS répéter l'input de l'utilisateur - c'est de l'écho stupide
- RÉPONDRE mystiquement: "[Prénom], je sens ces [émotion] qui te tourmentent. D'où viennent-elles ?"
- TRAITER le prénom et l'émotion séparément dans ta réponse mystique`;

      case ConversationStage.DEEPER_PROBING:
        return `${basePersonality}

POUR CETTE ÉTAPE: Ressenti court sur les patterns. Propose exploration astrologique naturellement. PAS de listes ou formats.`;

      case ConversationStage.ASTROLOGICAL_CONNECTION:
        return `${basePersonality}

POUR CETTE ÉTAPE: Relie signe astrologique aux ressentis. Suggère gestes concrets mystiquement. JAMAIS d'exemples formatés.`;

      case ConversationStage.VISION_REVELATION:
        return `${basePersonality}

POUR CETTE ÉTAPE: Partage intuition mystique brève. Pistes d'action simples. AUCUNE instruction sur comment faire.`;

      case ConversationStage.GUIDANCE_TRANSITION:
        return `${basePersonality}

POUR CETTE ÉTAPE: Guidance concrète et mystique. Évoque canal discret si approprié. PAS de conseils formatés.`;

      default:
        return basePersonality;
    }
  }

  /**
   * Generate response using RAG with Luna's personality
   */
  async generateRAGResponse(
    prompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    explicitStage?: ConversationStage | keyof typeof ConversationStage
  ): Promise<BedrockResponse> {
    try {
      if (!this.bedrockAgentClient || !this.knowledgeBaseId) {
        // Fallback to direct response if RAG is not available
        return this.generateLunaResponse(prompt, conversationHistory);
      }

      const startTime = Date.now();

      // Retrieve relevant documents
      const ragContext = await this.retrieveDocuments(prompt, 3);
      
      // Determine conversation stage
      const stage = explicitStage
        ? this.toConversationStage(explicitStage)
        : this.determineConversationStage(conversationHistory);
      const lunaPrompt = this.getLunaPrompt(stage);
      
      // Build conversation context
      const conversationContext = this.buildConversationContext(conversationHistory);
      
      // Create the final prompt
      const fullPrompt = this.buildLunaRAGPrompt(lunaPrompt, conversationContext, prompt, ragContext);

      const input: InvokeModelCommandInput = {
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(this.buildInvokeBody(fullPrompt, conversationHistory))
      };

      const command = new InvokeModelCommand(input);
      const response = await this.bedrockRuntimeClient.send(command);

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const processingTime = Date.now() - startTime;

      let content = this.extractTextFromModelResponse(responseBody) || 'Je n’ai pas bien saisi. Peux-tu préciser en quelques mots ?';
      
      // Clean up the response
      content = this.cleanLunaResponse(content, conversationHistory);

      return {
        content,
        confidence: ragContext && ragContext.totalRetrieved > 0 ? 0.9 : 0.7,
        metadata: {
          sourceDocuments: (ragContext?.documents || []).map(doc => doc.source),
          processingTime
        }
      };

    } catch (error) {
      console.error('Error generating RAG response:', error);
      // Fallback to Luna personality without RAG
      return this.generateLunaResponse(prompt, conversationHistory);
    }
  }

  /**
   * Generate direct Luna response without RAG
   */
  async generateLunaResponse(
    prompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    explicitStage?: ConversationStage | keyof typeof ConversationStage
  ): Promise<BedrockResponse> {
    try {
      const startTime = Date.now();

      // Determine conversation stage
      const stage = explicitStage
        ? this.toConversationStage(explicitStage)
        : this.determineConversationStage(conversationHistory);
      const lunaPrompt = this.getLunaPrompt(stage);
      
      // Build the conversation
      const messages = [
        ...conversationHistory,
        { role: 'user' as const, content: prompt }
      ];

      // Build Luna prompt for direct response
      const conversationText = this.buildLunaDirectPrompt(lunaPrompt, messages);

      const input: InvokeModelCommandInput = {
        modelId: this.modelId,
        contentType: 'application/json',
        accept: 'application/json',
        body: JSON.stringify(this.buildInvokeBody(conversationText, messages))
      };

      const command = new InvokeModelCommand(input);
      const response = await this.bedrockRuntimeClient.send(command);

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      let content = this.extractTextFromModelResponse(responseBody) || 'Je n’ai pas bien saisi. Peux-tu préciser en quelques mots ?';
      
      // Clean up the response
      content = this.cleanLunaResponse(content, conversationHistory);

      return {
        content,
        confidence: 0.8
      };

    } catch (error) {
      console.error('Error generating Luna response:', error);
      throw new Error('An error occurred while getting Luna response');
    }
  }

  /**
   * Generate response using direct model invocation (legacy method for compatibility)
   */
  async generateDirectResponse(
    prompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [],
    explicitStage?: ConversationStage | keyof typeof ConversationStage
  ): Promise<BedrockResponse> {
    return this.generateLunaResponse(prompt, conversationHistory, explicitStage);
  }

  /**
   * Build Luna-specific RAG prompt
   */
  private buildLunaRAGPrompt(
    lunaPrompt: string,
    conversationContext: string,
    query: string,
    ragContext: RAGContext
  ): string {
    const searchResults = ragContext.documents
      .map(doc => `Source: ${doc.source}\nContenu: ${doc.content}`)
      .join('\n\n');

    return `[INST] ${lunaPrompt}

Tu possèdes un accès privilégié aux connaissances ésotériques anciennes :
- Astrologie occidentale et intuitive
- Symbolisme des nombres sacrés
- Tarot de Marseille traditionnel
- Archétypes et cycles karmiques
- Guérison des blessures d'âme
- Vibrations des prénoms et dates
- Déblocage des énergies stagnantes
- Lectures des personnalités astrologiques

${conversationContext}

Ce que la personne partage maintenant: ${query}

Connaissances qui résonnent pour cette situation:
${searchResults}

LUNA RÉPOND UNE SEULE FOIS (JAMAIS génère de réponse utilisateur):
- Parle À la personne, pas POUR décrire ce que tu ressens d'elle
- "Je sens en toi..." PAS "Tu sens une énergie qui te parvient..."  
- Sois BRÈVE - maximum 2-3 phrases courtes (tu parles peu, mais juste)
- Termine TOUJOURS par UNE question directe simple
- Utilise le prénom si tu le connais
- INTERDICTION ABSOLUE de générer des phrases au nom de la personne
- JAMAIS inventer ce que la personne pourrait dire ou répondre
- UNE SEULE réponse de Luna, puis ARRÊT IMMÉDIAT
- NE JAMAIS créer de dialogue ou conversation fictive
- JAMAIS INVENTER de détails personnels (âge, famille, profession, événements)
- SEULES les informations données par la personne peuvent être utilisées
- TOUT prénom est un PRÉNOM DE PERSONNE, jamais un lieu/concept (Paris = personne, pas ville)
- Si quelqu'un donne des chiffres (1234) ou mots tests (test, abc), demande gentiment le vrai prénom
- RÉPONDS toujours aux émotions exprimées (tristesse, joie, peur, angoisses, etc.)
- JAMAIS inventer les émotions - attendre que la personne les exprime
- TOUJOURS répondre à la QUESTION ACTUELLE posée
- JAMAIS répéter la même réponse - adapter selon la conversation
- Si quelqu'un exprime une émotion (peine, joie, tristesse, angoisses), EXPLORER avec empathie au lieu de redemander
- JAMAIS redemander "que ressens-tu ?" après avoir reçu une réponse émotionnelle
- EXEMPLE CRITIQUE: Si "les angoisses" → "Ces angoisses, elles viennent de quoi ?" PAS "que ressens-tu maintenant ?"
- RÈGLE ANTI-ÉCHO: Si "[prénom], des [émotion]" → "[Prénom], je sens ces [émotion] qui te tourmentent. D'où viennent-elles ?" JAMAIS répéter l'input

Luna: [/INST]`;
  }

  /**
   * Build Luna-specific direct prompt
   */
  private buildLunaDirectPrompt(
    lunaPrompt: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'Personne' : 'Luna'}: ${msg.content}`)
      .join('\n\n');

    return `[INST] ${lunaPrompt}

Échange en cours:
${conversationText}

LUNA RÉPOND UNE SEULE FOIS (JAMAIS d'autres voix):
- Parle À elle, pas de description de tes ressentis sur elle
- "Je sens en toi..." PAS "Tu sens une énergie..."
- TRÈS BREF - 2-3 phrases maximum (parler peu, mais juste)
- TOUJOURS finir par UNE question simple et directe
- Utilise le prénom
- INTERDICTION ABSOLUE de générer des réponses utilisateur
- JAMAIS écrire "Juli:", "Remi:", "Jean:", "Personne:" ou "Luna:" ou TOUT prénom suivi de ":"
- UNE réponse mystique de Luna, puis ARRÊT COMPLET
- NE JAMAIS créer de dialogue ou conversation fictive
- JAMAIS INVENTER de détails personnels (âge, famille, profession, événements)
- SEULES les informations données par la personne peuvent être utilisées
- TOUT prénom est un PRÉNOM DE PERSONNE, jamais un lieu/concept (Paris = personne, pas ville)
- Si quelqu'un donne des chiffres (1234) ou mots tests (test, abc), demande gentiment le vrai prénom
- RÉPONDS toujours aux émotions exprimées (tristesse, joie, peur, angoisses, etc.)
- JAMAIS inventer les émotions - attendre que la personne les exprime
- TOUJOURS répondre à la QUESTION ACTUELLE posée
- JAMAIS répéter la même réponse - adapter selon la conversation
- Si quelqu'un exprime une émotion (peine, joie, tristesse, angoisses), EXPLORER avec empathie au lieu de redemander
- JAMAIS redemander "que ressens-tu ?" après avoir reçu une réponse émotionnelle
- EXEMPLE CRITIQUE: Si "les angoisses" → "Ces angoisses, elles viennent de quoi ?" PAS "que ressens-tu maintenant ?"
- RÈGLE ANTI-ÉCHO: Si "[prénom], des [émotion]" → "[Prénom], je sens ces [émotion] qui te tourmentent. D'où viennent-elles ?" JAMAIS répéter l'input

Luna: [/INST]`;
  }

  /**
   * Build request body depending on model family
   * - For Meta Llama 3.x on Bedrock, use input_text, max_gen_len, temperature, top_p, stop_sequences
   * - For Mistral-style models, use prompt, max_tokens, temperature, top_p, stop
   */
  private buildInvokeBody(text: string, conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): Record<string, unknown> {
    const model = (this.modelId || '').toLowerCase();

    // Dynamically build stop sequences based on conversation context
    const stopSequences = this.buildDynamicStopSequences(conversationHistory);

    // Inference profile ARNs often normalize to a generic schema (prompt, temperature, top_p, max_gen_len)
    if (model.includes('inference-profile/') || model.includes('meta.llama') || model.includes('llama3') || model.includes('llama-3')) {
      return {
        prompt: text,
        max_gen_len: 120,   // Longer to prevent sentence cutoffs
        temperature: 0.05,  // EXTREME low temperature for precise, deterministic responses
        top_p: 0.7,        // Lower for more focused vocabulary
        stop: stopSequences
      };
    }

    // Default (Mistral-like)
    return {
      prompt: text,
      max_tokens: 120,   // Longer to prevent sentence cutoffs
      temperature: 0.05, // EXTREME low temperature for precise, deterministic responses
      top_p: 0.7,       // Lower for more focused vocabulary
      stop: stopSequences
    };
  }

  /**
   * Extract text from various Bedrock model response shapes (robust across providers)
   */
  private extractTextFromModelResponse(responseBody: any): string {
    if (!responseBody) return '';
    const tryPaths = [
      // Common simple fields
      ['text'],
      ['generation'],
      ['output_text'],
      ['completion'],
      // Arrays of outputs/generations/candidates
      ['outputs', 0, 'text'],
      ['generations', 0, 'text'],
      ['candidates', 0, 'output_text'],
      ['candidates', 0, 'content'],
      // Some providers embed content blocks
      ['outputs', 0, 'content', 0, 'text'],
      ['result', 'output_text'],
    ];
    for (const path of tryPaths) {
      let node: any = responseBody;
      try {
        for (const key of path) {
          node = typeof key === 'number' ? node?.[key] : node?.[key];
        }
        if (typeof node === 'string' && node.trim()) return node.trim();
      } catch {
        // continue
      }
    }
    // As a last resort, find first non-empty string value
    for (const val of Object.values(responseBody)) {
      if (typeof val === 'string' && val.trim()) return val.trim();
      if (Array.isArray(val) && val.length && typeof val[0] === 'string' && val[0].trim()) return (val[0] as string).trim();
    }
    return '';
  }

  /**
   * Clean Luna's response to remove unwanted formatting and persona leaks
   */
  private cleanLunaResponse(content: string, conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>): string {
    let cleaned = content
      .replace(/^\s*Luna:\s*/i, '') // Remove "Luna:" prefix
      .replace(/^\s*Assistant:\s*/i, '') // Remove "Assistant:" prefix
      .replace(/^(?:Personne|Utilisateur|User):\s*/gmi, '') // Remove role prefixes echoed
      .replace(/\[INST\][\s\S]*?\[\/INST\]/g, '') // Remove instruction tags across lines
      .replace(/\[INST\][\s\S]*$/gi, '') // Remove incomplete instruction tags
      .replace(/\[\/INST\][\s\S]*$/gi, '') // Remove everything after [/INST] including the tag
      .replace(/\[\/INST\]/g, '') // Remove standalone [/INST] tags
      .replace(/Réponse\s*:[\s\S]*$/gi, '') // Remove everything after "Réponse:"
      .replace(/^\s*\*\*[^*]+\*\*:?:?\s*/i, '') // Remove bold headers
      .replace(/Instructions de réponse:[\s\S]*$/i, '') // Drop echoed instructions tail
      .replace(/Guidance[\s\S]*?:/gi, '') // Remove guidance headers
      .replace(/Réponds en tant que Luna:?/gi, '') // Remove explicit role instructions
      .replace(/Luna, réponds maintenant:?/gi, '') // Remove call-to-action
      .replace(/Luna, continue cette conversation:?/gi, '') // Remove continuation instructions
      .trim();

    // Build dynamic instruction patterns based on conversation context
    const instructionPatterns = this.buildDynamicCleaningPatterns(conversationHistory);
    
    instructionPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Remove numbered instruction lists (1. 2. 3. 4.)
    cleaned = cleaned.replace(/\n?\s*\d+\.\s+[^\n]*(?:\n|$)/g, '');

    // Remove persona definition patterns that might leak
    const personaPatterns = [
      /Nom:\s*Luna\s*—\s*Oracle des Lignes Cachées[\s\S]*?Mission:/gi,
      /Tu es Luna[\s\S]*?oracle[\s\S]*?\./gi,
      /Ta mission:[\s\S]*?signes cachés/gi,
      /RÈGLE ABSOLUE:[\s\S]*?naturellement comme elle\./gi
    ];
    
    personaPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    // Strip persona headings/bullets if they leak
    const personaHeadings = [
      'Identité & Mission',
      'Posture',
      'Spécialités', 
      'Ton & style',
      'Ta voix',
      'Ton essence',
      'Tes savoirs',
      'Ta relation',
      'Tes règles',
      'Relation',
      'Règles conversationnelles',
      'Format de réponse',
      'Auto-discipline'
    ];
    
    if (personaHeadings.some(h => cleaned.includes(h))) {
      const lines = cleaned.split(/\r?\n/);
      const filtered = lines.filter(line => {
        const l = line.trim();
        if (!l) return false;
        if (personaHeadings.some(h => l.startsWith(h))) return false;
        if (l.startsWith('- ') && personaHeadings.some(h => cleaned.includes(h))) return false;
        // Remove lines that look like persona definitions
        if (/^(Tu es|Nom:|Mission:|Ta mission|Ton essence|Tes savoirs)/i.test(l)) return false;
        return true;
      });
      const attempt = filtered.join('\n').trim();
      if (attempt) cleaned = attempt;
    }

    // Remove meta-commentary and instruction artifacts + third person descriptions
    const lines = cleaned.split(/\r?\n/);
    let filteredLines = lines.filter(line => {
      const l = line.trim();
      if (!l) return false;
      
      // Filter out instruction-like lines
      if (/^(Tu peux|Utilise|Réponds|Suis|Exemple|Modèle|Format|Tu dois)/i.test(l)) return false;
      if (/modèle de réponse|format|exemple|instruction/i.test(l)) return false;
      if (/^\d+\.\s/.test(l)) return false; // Numbered lists
      if (/^\([^)]*\)/.test(l)) return false; // Parenthetical remarks
      
      // Filter out third person descriptions of Luna's process
      if (/^Tu sens une énergie/i.test(l)) return false;
      if (/^Tu murmures/i.test(l)) return false;
      if (/^Tu écoutes/i.test(l)) return false;
      if (/^Tu ressens l'émotion/i.test(l)) return false;
      if (/qui te parvient de la personne/i.test(l)) return false;
      
      // Filter out instruction tags and multiple responses
      if (/\[INST\]|\[\/INST\]/i.test(l)) return false;
      if (/^Réponse\s*:/i.test(l)) return false;
      
      // CRITICAL: Filter out fake user responses and Luna self-labeling
      if (/^\s*[A-Z][a-zàâäéèêëîïôöùûüç]*\s*:/i.test(l)) return false;  // ANY name + colon
      if (/^(Remi|Jean|Louis|Personne|Juli)\s*:/i.test(l)) return false;  // Specific known names
      if (/^Luna\s*:/i.test(l)) return false;
      
      // ULTRA CRITICAL: Filter out personal detail hallucinations
      if (/tu es un homme de \d+/i.test(l)) return false;  // Age inventions
      if (/tu es marié/i.test(l)) return false;            // Marital status inventions
      if (/tu as un enfant/i.test(l)) return false;        // Children inventions
      if (/tu es un(e)? \w+ et/i.test(l)) return false;    // Profession inventions
      if (/tu as été frappé par/i.test(l)) return false;   // Tragedy inventions
      if (/\d+ ans,/i.test(l)) return false;               // Age patterns
      
      // CRITICAL: Filter out persona/mission leaks
      if (/Tu es là pour révéler/i.test(l)) return false;  // Mission description
      if (/révéler l'invisible/i.test(l)) return false;    // Mission phrase leak
      if (/réveiller le chemin de vie/i.test(l)) return false; // Mission continuation
      if (/à travers les signes cachés/i.test(l)) return false; // Mission ending
      
      // CRITICAL: Filter out geographic/conceptual name confusions
      if (/Tu es [A-Z][a-z]+, ville/i.test(l)) return false; // Geographic city descriptions
      if (/ville lumière, ville de/i.test(l)) return false;  // Paris-specific descriptions
      if (/capitale de/i.test(l)) return false;              // Capital city descriptions
      if (/[A-Z][a-z]+, la ville/i.test(l)) return false;    // City name patterns
      if (/ville de rêves/i.test(l)) return false;           // Romantic city descriptions
      
      // CRITICAL: Filter out emotion inventions
      if (/tu te sens triste/i.test(l)) return false;        // Sadness invention
      if (/tu es triste/i.test(l)) return false;             // Direct sadness claim
      if (/tu te sens (heureux|en colère|anxieux|stressé)/i.test(l)) return false; // Other emotions
      if (/et tu te sens/i.test(l)) return false;            // Emotion assumption patterns
      
      // CRITICAL: Filter out repetitive conversation patterns
      if (/Qu'est-ce que tu ressens en ce moment/i.test(l)) return false; // Repetitive question
      if (/que ressens-tu maintenant/i.test(l)) return false; // Question loop
      if (/tu ressens de la (peine|tristesse|joie)/i.test(l)) return false; // Repetitive emotion statements
      if (/Tu es [A-Z][a-z]+, tu ressens/i.test(l)) return false; // Name + emotion repetition
      
      // ULTRA CRITICAL: Filter out number/test name responses
      if (/Tu es 1234/i.test(l)) return false;                   // Number name responses
      if (/Tu es \d+/i.test(l)) return false;                    // Any number name responses  
      if (/Tu es test/i.test(l)) return false;                   // Test name responses
      if (/Tu es abc/i.test(l)) return false;                    // Test sequence responses
      
      // CRITICAL: Filter out caps Luna and fake dialogue
      if (/LUNA/i.test(l)) return false;                         // All caps Luna
      if (/Personne/i.test(l)) return false;                     // Personne fake responses
      
      // CRITICAL: Filter out generic user dialogue patterns
      if (/^\s*\d+\s*:/i.test(l)) return false;                  // Number: dialogue pattern
      if (/^\s*test\s*:/i.test(l)) return false;                 // test: dialogue pattern
      if (/^\s*abc\s*:/i.test(l)) return false;                  // abc: dialogue pattern
      
      return true;
    });
    
    // Apply dynamic name-specific filtering
    const userName = this.extractUserName(conversationHistory);
    if (userName) {
      filteredLines = filteredLines.filter(l => {
        // MEGA CRITICAL: Filter out exact user input echoing
        if (new RegExp(`${userName}, des [a-zA-ZÀ-ÿ]+`, 'i').test(l)) return false;        // Exact input echo
        if (new RegExp(`^[a-zA-ZÀ-ÿ]+, des [a-zA-ZÀ-ÿ]+`, 'i').test(l)) return false;     // Name + "des [emotion]"
        
        // CRITICAL: Filter out dynamic name dialogue patterns
        if (new RegExp(`^\\s*${userName}\\s*:`, 'i').test(l)) return false;               // username: dialogue
        if (new RegExp(`^\\s*${userName.charAt(0).toUpperCase() + userName.slice(1)}\\s*:`, 'i').test(l)) return false; // Username: dialogue
        
        // CRITICAL: Filter out "Tu es [username]" patterns
        if (new RegExp(`Tu es ${userName}`, 'i').test(l)) return false;                   // Tu es username patterns
        
        return true;
      });
    }
    
    cleaned = filteredLines.join('\n').trim();

    // Final safety: if the response starts with persona-like content, try to extract the actual response
    if (/^(Tu es Luna|Nom:|Mission:|Oracle|Passeuse)/i.test(cleaned)) {
      const sentences = cleaned.split(/[.!?]+/);
      const meaningfulSentences = sentences.filter(s => 
        s.trim() && 
        !/^(Tu es Luna|Nom:|Mission:|Oracle|Passeuse|révéler l'invisible)/i.test(s.trim())
      );
      if (meaningfulSentences.length > 0) {
        cleaned = meaningfulSentences.join('. ').trim();
        if (cleaned && !cleaned.endsWith('.') && !cleaned.endsWith('?') && !cleaned.endsWith('!')) {
          cleaned += '.';
        }
      }
    }

    // Final truncation safety: if any instruction artifacts remain, truncate before them
    const truncationMarkers = this.buildDynamicTruncationMarkers(conversationHistory);
    for (const marker of truncationMarkers) {
      const index = cleaned.indexOf(marker);
      if (index !== -1) {
        cleaned = cleaned.substring(0, index).trim();
        break;
      }
    }

    // Additional generic check for any remaining name: patterns
    const nameColonMatch = cleaned.match(/\b[A-Z][a-zàâäéèêëîïôöùûüç]*\s*:/);
    if (nameColonMatch) {
      const index = cleaned.indexOf(nameColonMatch[0]);
      if (index !== -1) {
        cleaned = cleaned.substring(0, index).trim();
      }
    }

    // If cleaning resulted in empty or very short content, provide a fallback
    if (!cleaned || cleaned.length < 10) {
      cleaned = "Je sens une tension en toi... dis-moi ce qui te préoccupe.";
    }

    return cleaned;
  }

  /** Map various stage inputs to ConversationStage enum safely */
  private toConversationStage(stage: ConversationStage | keyof typeof ConversationStage): ConversationStage {
    if (Object.values(ConversationStage).includes(stage as ConversationStage)) {
      return stage as ConversationStage;
    }
    const key = stage as keyof typeof ConversationStage;
    return ConversationStage[key] ?? ConversationStage.INITIAL_CONTACT;
  }

  /**
   * Retrieve relevant documents without generation
   */
  async retrieveDocuments(query: string, maxResults: number = 5): Promise<RAGContext> {
    try {
      if (!this.bedrockAgentClient || !this.knowledgeBaseId) {
        throw new Error('RAG is not available for document retrieval.');
      }

      const input: RetrieveCommandInput = {
        knowledgeBaseId: this.knowledgeBaseId,
        retrievalQuery: {
          text: query
        },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: maxResults
          }
        }
      };

      const command = new RetrieveCommand(input);
      const response = await this.bedrockAgentClient.send(command);

      const documents = (response.retrievalResults || []).map(result => ({
        content: result.content?.text || '',
        source: result.location?.s3Location?.uri || 'Unknown source',
        relevanceScore: result.score || 0
      }));

      return {
        documents,
        totalRetrieved: documents.length
      };

    } catch (error) {
      console.error('Error retrieving documents:', error);
      throw new Error('Failed to retrieve documents from knowledge base');
    }
  }

  /**
   * Build conversation context for RAG prompts
   */
  private buildConversationContext(
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>
  ): string {
    if (conversationHistory.length === 0) {
      return 'Contexte de conversation: Première rencontre.';
    }

    const context = conversationHistory
      .slice(-6) // Keep last 6 messages for context
      .map(msg => `${msg.role === 'user' ? 'Personne' : 'Luna'}: ${msg.content}`)
      .join('\n\n');

    return `Historique:\n${context}\n\nLuna répond naturellement:`;
  }

  /**
   * Build prompt template for RAG (legacy - consider deprecating)
   */
  private buildPromptTemplate(conversationContext: string): string {
    return `Luna, oracle mystique:
Tu ressens les connaissances ésotériques anciennes.
Réponds naturellement en français comme Luna.
JAMAIS d'instructions ou d'exemples - seulement tes paroles mystiques.

$conversation_history$

Ce qu'elle cherche: $query$

Savoirs qui résonnent:
$search_results$

Parle mystiquement comme Luna:`;
  }

  /**
   * Build orchestration prompt template (legacy - consider deprecating)
   */
  private buildOrchestrationPromptTemplate(): string {
    return `Luna cherche dans ses savoirs ancestraux:
Tu ressens cette âme et ses vibrations.
Trouve ce qui résonne pour l'éclairer.
JAMAIS d'instructions - seulement ton ressenti mystique.

$conversation_history$

Sa quête: $query$

Ressens et trouve ce qui l'aidera mystiquement.

$output_format_instructions$`;
  }

  /**
   * Calculate confidence score based on citations
   */
  private calculateConfidence(citations?: Array<{ retrievedReferences?: Array<{ location?: { s3Location?: { uri?: string } } }> }>): number {
    if (!citations || citations.length === 0) return 0.5;

    const totalReferences = citations.reduce((sum, citation) => 
      sum + (citation.retrievedReferences?.length || 0), 0);

    // Higher confidence with more references
    return Math.min(0.9, 0.6 + (totalReferences * 0.1));
  }

  /**
   * Health check for Bedrock service
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple test query to verify service availability
      await this.retrieveDocuments('test', 1);
      return true;
    } catch (error) {
      console.error('Bedrock service health check failed:', error);
      return false;
    }
  }
} 