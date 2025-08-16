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
    // Simple name detection - look for common name patterns
    return firstMessage.length < 50 && (
      /je m'appelle|mon nom|je suis|c'est/.test(firstMessage) ||
      (firstMessage.split(' ').length <= 3 && !/comment|pourquoi|quoi|où|quand/.test(firstMessage))
    );
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
- SEULES les informations explicitement données par la personne peuvent être utilisées
- Si tu ne sais pas quelque chose sur la personne, pose une question plutôt que d'inventer
`;

    switch (stage) {
      case ConversationStage.INITIAL_CONTACT:
        return `${basePersonality}

POUR CETTE ÉTAPE: Accueil mystique bref. Demande le prénom naturellement. PAS d'explications sur comment répondre.`;

      case ConversationStage.NAME_REQUEST:
        return `${basePersonality}

POUR CETTE ÉTAPE: Ressens le prénom, parle-lui directement (pas de description de tes ressentis). 1-2 phrases + question simple sur ses émotions.`;

      case ConversationStage.FEELING_INQUIRY:
        return `${basePersonality}

POUR CETTE ÉTAPE: Exprime ton ressenti des émotions partagées. Question mystique pour approfondir. AUCUN modèle de réponse.`;

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
        body: JSON.stringify(this.buildInvokeBody(fullPrompt))
      };

      const command = new InvokeModelCommand(input);
      const response = await this.bedrockRuntimeClient.send(command);

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const processingTime = Date.now() - startTime;

      let content = this.extractTextFromModelResponse(responseBody) || 'Je n’ai pas bien saisi. Peux-tu préciser en quelques mots ?';
      
      // Clean up the response
      content = this.cleanLunaResponse(content);

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
        body: JSON.stringify(this.buildInvokeBody(conversationText))
      };

      const command = new InvokeModelCommand(input);
      const response = await this.bedrockRuntimeClient.send(command);

      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      let content = this.extractTextFromModelResponse(responseBody) || 'Je n’ai pas bien saisi. Peux-tu préciser en quelques mots ?';
      
      // Clean up the response
      content = this.cleanLunaResponse(content);

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

Luna: [/INST]`;
  }

  /**
   * Build request body depending on model family
   * - For Meta Llama 3.x on Bedrock, use input_text, max_gen_len, temperature, top_p, stop_sequences
   * - For Mistral-style models, use prompt, max_tokens, temperature, top_p, stop
   */
  private buildInvokeBody(text: string): Record<string, unknown> {
    const model = (this.modelId || '').toLowerCase();

    // Bedrock has a maximum of 10 stop sequences - prioritize the most critical ones
    const stopSequences = [
      'Juli:',                     // ULTRA CRITICAL: prevents this specific fake response
      'Remi:',                     // CRITICAL: prevents fake user responses
      'Jean:',                     // CRITICAL: prevents fake user responses  
      'Louis:',                    // CRITICAL: prevents fake user responses
      'Luna:',                     // CRITICAL: prevents Luna labeling herself
      'Personne:',                 // CRITICAL: prevents fake user responses
      'Tu es là pour',            // CRITICAL: prevents mission description to user
      'révéler l\'invisible',     // CRITICAL: prevents persona leak
      'tu es un homme',            // CRITICAL: prevents invented personal details
      'réveiller le chemin'       // CRITICAL: prevents mission description
    ];

    // Inference profile ARNs often normalize to a generic schema (prompt, temperature, top_p, max_gen_len)
    if (model.includes('inference-profile/') || model.includes('meta.llama') || model.includes('llama3') || model.includes('llama-3')) {
      return {
        prompt: text,
        max_gen_len: 120,   // Longer to prevent sentence cutoffs
        temperature: 0.25,  // Lower temperature for more focused responses
        top_p: 0.8,        // Slightly lower for more focused vocabulary
        stop: stopSequences
      };
    }

    // Default (Mistral-like)
    return {
      prompt: text,
              max_tokens: 120,   // Longer to prevent sentence cutoffs
      temperature: 0.25, // Lower temperature for more focused responses
      top_p: 0.8,       // Slightly lower for more focused vocabulary
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
  private cleanLunaResponse(content: string): string {
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

    // Remove instruction and meta-commentary patterns + third person descriptions + fake user responses
    const instructionPatterns = [
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
      /à travers les signes cachés[\s\S]*/gi       // Mission ending
    ];
    
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
    const filteredLines = lines.filter(line => {
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
      
      return true;
    });
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
    const truncationMarkers = [
      'Juli:', 'Remi:', 'Jean:', 'Louis:', 'Personne:',  // CRITICAL: Stop fake user responses
      'Luna:',                                             // CRITICAL: Stop self-labeling
      '[/INST]', '[INST]', 'Réponse:', 
      'Tu sens une énergie',
      'tu es un homme de',                                 // CRITICAL: Stop personal detail hallucinations
      'tu es marié',                                       // CRITICAL: Stop marital status inventions
      'tu as un enfant',                                   // CRITICAL: Stop family inventions
      'tu as été frappé par',                              // CRITICAL: Stop tragedy inventions
      'Tu es là pour révéler',                             // CRITICAL: Stop mission descriptions
      'révéler l\'invisible',                             // CRITICAL: Stop persona leaks
      'réveiller le chemin'                                // CRITICAL: Stop mission phrases
    ];
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
      cleaned = "Je sens quelque chose en toi... que ressens-tu maintenant ?";
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