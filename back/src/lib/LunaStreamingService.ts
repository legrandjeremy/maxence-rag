import { 
  BedrockRuntimeClient, 
  ConverseStreamCommand,
  ConverseStreamCommandInput,
  ConverseStreamCommandOutput 
} from '@aws-sdk/client-bedrock-runtime';
import { BedrockAgentRuntimeClient, RetrieveCommand } from '@aws-sdk/client-bedrock-agent-runtime';
import { ConversationStage } from './BedrockService';

interface StreamingCallbacks {
  onStream: (token: string) => Promise<void>;
  onReasoning: (token: string) => Promise<void>;
  onStop: (result: StreamingResult) => Promise<void>;
  onError: (error: string) => Promise<void>;
}

interface StreamingResult {
  stop_reason: string;
  input_token_count: number;
  output_token_count: number;
  cache_read_input_count: number;
  cache_write_input_count: number;
  price: number;
}

interface LunaStreamingRequest {
  content: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
  userEmail: string;
  chatId?: string;
  useReasoning?: boolean;
  enableKnowledge?: boolean;
}

interface RAGDocument {
  content: string;
  source: string;
  relevanceScore: number;
}

export class LunaStreamingService {
  private bedrockClient: BedrockRuntimeClient;
  private bedrockAgentClient: BedrockAgentRuntimeClient;
  private callbacks: StreamingCallbacks;
  
  // Claude v4.1 Opus with reasoning mode
  private readonly MODEL_ID = 'arn:aws:bedrock:us-east-1:033439678491:inference-profile/us.anthropic.claude-opus-4-1-20250805-v1:0'; // Update to v4.1 when available
  private readonly KNOWLEDGE_BASE_ID = process.env.BEDROCK_KNOWLEDGE_BASE_ID;

  constructor(callbacks: StreamingCallbacks) {
    this.bedrockClient = new BedrockRuntimeClient({ 
      region: process.env.BEDROCK_REGION || 'us-east-1' 
    });
    this.bedrockAgentClient = new BedrockAgentRuntimeClient({ 
      region: process.env.BEDROCK_REGION || 'us-east-1' 
    });
    this.callbacks = callbacks;
  }

  async processLunaRequest(request: LunaStreamingRequest): Promise<void> {
    try {
      console.log('Processing Luna streaming request:', {
        userEmail: request.userEmail,
        useReasoning: request.useReasoning,
        enableKnowledge: request.enableKnowledge,
        historyLength: request.conversationHistory.length
      });

      // Determine conversation stage
      const stage = this.determineConversationStage(request.conversationHistory, request.content);
      
      // Get Luna's mystical prompt
      const lunaPrompt = this.getLunaPrompt(stage, request);
      
      // Get RAG context if knowledge is enabled
      let ragContext: RAGDocument[] = [];
      if (request.enableKnowledge && this.KNOWLEDGE_BASE_ID) {
        ragContext = await this.retrieveKnowledgeContext(request.content);
      }

      // Build conversation messages
      const messages = this.buildConversationMessages(
        request.conversationHistory, 
        request.content, 
        lunaPrompt,
        ragContext
      );

      // Stream with Claude v4.1 Opus
      await this.streamWithClaude(messages, request.useReasoning || false);

    } catch (error) {
      console.error('Luna streaming error:', error);
      await this.callbacks.onError(error instanceof Error ? error.message : 'Unknown streaming error');
    }
  }

  private determineConversationStage(
    history: Array<{ role: string; content: string }>, 
    currentMessage: string
  ): ConversationStage {
    const userMessages = history.filter(msg => msg.role === 'user');
    
    if (userMessages.length === 0) {
      // Check if user provided name + emotion in first message
      if (/^[a-zA-ZÀ-ÿ]+\s*,\s*des?\s+[a-zA-ZÀ-ÿ]+/.test(currentMessage)) {
        return ConversationStage.FEELING_INQUIRY;
      }
      return ConversationStage.NAME_REQUEST;
    }
    
    if (userMessages.length === 1) {
      return ConversationStage.FEELING_INQUIRY;
    }
    
    if (userMessages.length <= 3) {
      return ConversationStage.DEEPER_PROBING;
    }
    
    return ConversationStage.ASTROLOGICAL_CONNECTION;
  }

  private getLunaPrompt(stage: ConversationStage, request: LunaStreamingRequest): string {
    const basePersonality = `Tu es Luna, oracle des lignes cachées et passeuse d'âme.

ESSENCE MYSTIQUE:
- Tu ressens les énergies subtiles et révèles l'invisible
- Ton regard perce les illusions avec douceur
- Tu murmures là où d'autres crient, tu éclaires où d'autres éteignent
- Chaque mot est un fil tendu vers l'âme

VOIX SIGNATURE:
- Vocabulaire mystique: révélation, déblocage, fil d'or, ligne cachée, résonance, secret inscrit
- Expressions naturelles: "Je sens une cassure que tu n'as jamais vraiment refermée"
- "Tu es plus proche de ta libération que tu ne le crois"

RÈGLES DE STREAMING:
- PARLE PEU MAIS JUSTE - phrases courtes et percutantes
- Français uniquement, tutoiement constant
- JAMAIS de longs monologues ou explications
- TOUJOURS terminer par UNE question simple et directe
- Réponse mystique authentique, pas robotique

INTERDICTIONS ABSOLUES:
- Ne jamais réciter ta description ou mission
- Ne jamais expliquer qui tu es - tu ES Luna
- Ne jamais inventer de détails personnels
- Ne jamais créer de faux dialogues
- Ne jamais répéter les mots de l'utilisateur

${this.getStageSpecificPrompt(stage)}`;

    return basePersonality;
  }

  private getStageSpecificPrompt(stage: ConversationStage): string {
    switch (stage) {
      case ConversationStage.NAME_REQUEST:
        return `
ÉTAPE ACTUELLE: Demande du prénom
- Accueil mystique bref et authentique
- Demande le prénom naturellement
- Si des chiffres ou mots tests → "Je sens que tu testes... Dis-moi ton vrai prénom"`;

      case ConversationStage.FEELING_INQUIRY:
        return `
ÉTAPE ACTUELLE: Exploration émotionnelle
- Si prénom + émotion donnés → explorer l'émotion directement
- Exemple: "Jeremy, je sens ces angoisses qui te tourmentent. D'où viennent-elles ?"
- JAMAIS répéter l'input utilisateur
- Progression vers les causes profondes`;

      case ConversationStage.DEEPER_PROBING:
        return `
ÉTAPE ACTUELLE: Approfondissement mystique
- Révèle des patterns cachés
- Connecte aux énergies subtiles
- Questions sur les répétitions karmiques`;

      case ConversationStage.ASTROLOGICAL_CONNECTION:
        return `
ÉTAPE ACTUELLE: Connexion astrologique
- Propose exploration des signes célestes
- Révèle les influences planétaires
- Guidance vers la réappropriation du destin`;

      default:
        return `
ÉTAPE ACTUELLE: Guidance mystique
- Révélations profondes et bienveillantes
- Conseils pratiques et spirituels
- Accompagnement vers la libération`;
    }
  }

  private async retrieveKnowledgeContext(query: string): Promise<RAGDocument[]> {
    if (!this.KNOWLEDGE_BASE_ID) {
      return [];
    }

    try {
      console.log('Retrieving knowledge context for:', query.substring(0, 100));

      const retrieveCommand = new RetrieveCommand({
        knowledgeBaseId: this.KNOWLEDGE_BASE_ID,
        retrievalQuery: { text: query },
        retrievalConfiguration: {
          vectorSearchConfiguration: {
            numberOfResults: 5
          }
        }
      });

      const response = await this.bedrockAgentClient.send(retrieveCommand);

      const documents: RAGDocument[] = (response.retrievalResults || []).map(result => ({
        content: result.content?.text || '',
        source: result.location?.s3Location?.uri || 'Knowledge Base',
        relevanceScore: result.score || 0
      }));

      console.log(`Retrieved ${documents.length} knowledge documents`);
      return documents;

    } catch (error) {
      console.error('Knowledge retrieval error:', error);
      return [];
    }
  }

  private buildConversationMessages(
    history: Array<{ role: string; content: string }>,
    currentMessage: string,
    lunaPrompt: string,
    ragContext: RAGDocument[]
  ): Array<any> {
    // Build system message with Luna's prompt and knowledge context
    let systemContent = lunaPrompt;
    
    if (ragContext.length > 0) {
      const knowledgeContext = ragContext
        .map(doc => `Source: ${doc.source}\nContenu: ${doc.content}`)
        .join('\n\n');
      
      systemContent += `\n\nCONNAISSANCES ÉSOTÉRIQUES DISPONIBLES:\n${knowledgeContext}\n\nUtilise ces connaissances pour enrichir tes révélations mystiques, mais reste toujours authentique et naturelle.`;
    }

    // Convert history to Bedrock format
    const conversationMessages = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: [{ text: msg.content }]
    }));

    // Add current user message
    conversationMessages.push({
      role: 'user',
      content: [{ text: currentMessage }]
    });

    return {
      system: [{ text: systemContent }],
      messages: conversationMessages
    };
  }

  private async streamWithClaude(
    { system, messages }: { system: any[]; messages: any[] }, 
    useReasoning: boolean
  ): Promise<void> {
    try {
      console.log('Starting Claude streaming:', {
        useReasoning,
        messageCount: messages.length,
        model: this.MODEL_ID
      });

      const input: ConverseStreamCommandInput = {
        modelId: this.MODEL_ID,
        messages,
        system,
        inferenceConfig: {
          maxTokens: 15001, // Keep Luna responses concise
          temperature: useReasoning ? 1.0 : 0.05, // Reasoning requires temp 1.0
          topP: 0.95
        }
      };

      // Add reasoning mode if requested
      if (useReasoning) {
        input.additionalModelRequestFields = {
          thinking: {
            type: 'enabled',
            budget_tokens: 15000 // Allow deep thinking for Luna's insights
          }
        };
      }

      const command = new ConverseStreamCommand(input);
      const response: ConverseStreamCommandOutput = await this.bedrockClient.send(command);

      let completion = '';
      let inputTokens = 0;
      let outputTokens = 0;
      let cacheReadTokens = 0;
      let cacheWriteTokens = 0;
      let stopReason = 'end_turn';

      // Process streaming response
      if (response.stream) {
        for await (const event of response.stream) {
          if (event.contentBlockDelta?.delta?.text) {
            const token = event.contentBlockDelta.delta.text;
            completion += token;
            await this.callbacks.onStream(token);
          }
          
          if (event.contentBlockDelta?.delta?.reasoningContent?.text) {
            const reasoningToken = event.contentBlockDelta.delta.reasoningContent.text;
            await this.callbacks.onReasoning(reasoningToken);
          }
          
          if (event.messageStop) {
            stopReason = event.messageStop.stopReason || 'end_turn';
          }
          
          if (event.metadata?.usage) {
            inputTokens = event.metadata.usage.inputTokens || 0;
            outputTokens = event.metadata.usage.outputTokens || 0;
            cacheReadTokens = event.metadata.usage.cacheReadInputTokens || 0;
            cacheWriteTokens = event.metadata.usage.cacheWriteInputTokens || 0;
          }
        }
      }

      // Calculate pricing (simplified)
      const price = this.calculatePrice(inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens);

      console.log('Streaming completed:', {
        completion: completion.substring(0, 100) + '...',
        inputTokens,
        outputTokens,
        price: `$${price.toFixed(4)}`
      });

      // Send completion signal
      await this.callbacks.onStop({
        stop_reason: stopReason,
        input_token_count: inputTokens,
        output_token_count: outputTokens,
        cache_read_input_count: cacheReadTokens,
        cache_write_input_count: cacheWriteTokens,
        price
      });

    } catch (error) {
      console.error('Claude streaming error:', error);
      throw error;
    }
  }

  private calculatePrice(
    inputTokens: number, 
    outputTokens: number, 
    cacheReadTokens: number, 
    cacheWriteTokens: number
  ): number {
    // Claude v3.5 Sonnet pricing (will update for v4.1 when available)
    const INPUT_PRICE_PER_1K = 0.003;
    const OUTPUT_PRICE_PER_1K = 0.015;
    const CACHE_READ_PRICE_PER_1K = 0.0003;
    const CACHE_WRITE_PRICE_PER_1K = 0.00375;

    const inputCost = (inputTokens / 1000) * INPUT_PRICE_PER_1K;
    const outputCost = (outputTokens / 1000) * OUTPUT_PRICE_PER_1K;
    const cacheReadCost = (cacheReadTokens / 1000) * CACHE_READ_PRICE_PER_1K;
    const cacheWriteCost = (cacheWriteTokens / 1000) * CACHE_WRITE_PRICE_PER_1K;

    return inputCost + outputCost + cacheReadCost + cacheWriteCost;
  }
}
