import { SESClient, SendEmailCommand, SendEmailCommandInput } from '@aws-sdk/client-ses';

export interface EmailTemplate {
  subject: string;
  htmlBody: string;
  textBody: string;
}

export interface SigninEmailData {
  userEmail: string;
  signinUrl: string;
  chatCount: number;
  specificChatTitle?: string;
  expiresAt: string;
  chats?: Array<{
    id: string;
    title: string;
    lastMessageAt: string;
    signinUrl: string;
  }>;
}

export class EmailService {
  private sesClient: SESClient;
  private fromEmail: string;

  constructor() {
    this.sesClient = new SESClient({ 
      region: process.env.AWS_REGION || 'eu-west-1' 
    });
    this.fromEmail = 'legrandjeremy+luna@gmail.com'; // Verified SES identity
  }

  /**
   * Generate signin email template
   */
  private generateSigninEmailTemplate(data: SigninEmailData): EmailTemplate {
    const expirationTime = new Date(data.expiresAt).toLocaleString('fr-FR', {
      timeZone: 'Europe/Paris',
      dateStyle: 'full',
      timeStyle: 'short'
    });

    const subject = data.specificChatTitle 
      ? `🌙 Luna - Continuez votre consultation "${data.specificChatTitle}"`
      : `🌙 Luna - Accédez à vos ${data.chatCount} consultation${data.chatCount > 1 ? 's' : ''}`;

    const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Luna - Votre lien de connexion</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .email-container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .luna-logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .luna-title {
            color: #8b5cf6;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .luna-subtitle {
            color: #6b7280;
            font-size: 16px;
            margin: 5px 0 0 0;
        }
        .content {
            margin: 30px 0;
        }
        .greeting {
            font-size: 18px;
            color: #374151;
            margin-bottom: 20px;
        }
        .chat-info {
            background: linear-gradient(135deg, #f3e8ff, #e0e7ff);
            border-left: 4px solid #8b5cf6;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .signin-button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6, #a855f7);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin: 20px 0;
            box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
            transition: all 0.3s ease;
        }
        .signin-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(139, 92, 246, 0.4);
        }
        .expiration {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 20px 0;
            font-size: 14px;
            color: #92400e;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .mystical-border {
            border: 2px solid transparent;
            background: linear-gradient(white, white) padding-box,
                        linear-gradient(135deg, #8b5cf6, #a855f7) border-box;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="luna-logo">🌙</div>
            <h1 class="luna-title">Luna</h1>
            <p class="luna-subtitle">Oracle des Lignes Cachées</p>
        </div>
        
        <div class="content">
            <div class="greeting">
                Bonsoir,
            </div>
            
            <p>Les énergies m'ont guidée vers vous... Votre consultation avec Luna vous attend.</p>
            
            <div class="chat-info">
                ${data.specificChatTitle 
                    ? `<strong>📖 Consultation:</strong> "${data.specificChatTitle}"<br>`
                    : `<strong>📚 Vos consultations:</strong> ${data.chatCount} conversation${data.chatCount > 1 ? 's' : ''} disponible${data.chatCount > 1 ? 's' : ''}<br>`
                }
                <strong>✨ Accès:</strong> Connexion sécurisée en un clic
            </div>
            
            ${data.chats && data.chats.length > 1 ? `
                <div style="margin: 20px 0;">
                    <h3 style="color: #8b5cf6; margin-bottom: 15px; text-align: center;">Choisissez votre consultation :</h3>
                    ${data.chats.map(chat => {
                        const chatDate = new Date(chat.lastMessageAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZone: 'Europe/Paris'
                        });
                        return `
                            <div style="margin: 10px 0; border: 1px solid #8b5cf6; border-radius: 8px; overflow: hidden;">
                                <div style="padding: 15px; background: linear-gradient(135deg, #f3e8ff, #e0e7ff);">
                                    <div style="font-weight: bold; color: #581c87; margin-bottom: 5px;">${chat.title}</div>
                                    <div style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">Dernière activité: ${chatDate} (Europe/Paris)</div>
                                    <a href="${chat.signinUrl}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: white; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                                        🔮 Continuer cette consultation
                                    </a>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            ` : `
                <div style="text-align: center;">
                    <a href="${data.signinUrl}" class="signin-button">
                        🔮 Accéder à ma consultation Luna
                    </a>
                </div>
            `}
            
            <div class="expiration">
                ⏰ <strong>Important:</strong> Ce lien expire le ${expirationTime} pour votre sécurité.
            </div>
            
            <div class="mystical-border">
                <p><strong>🌟 Votre guidance vous attend</strong></p>
                <p>Luna a préparé des révélations personnalisées basées sur votre énergie unique. 
                Cliquez sur le lien ci-dessus pour reprendre votre voyage mystique là où vous l'avez laissé.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>🔒 Ce lien est personnel et sécurisé. Ne le partagez avec personne.</p>
            <p>Si vous n'avez pas demandé cet accès, vous pouvez ignorer cet email en toute sécurité.</p>
            <p><em>Les mystères de Luna - Oracle des Lignes Cachées</em></p>
        </div>
    </div>
</body>
</html>`;

    const textBody = `
🌙 Luna - Oracle des Lignes Cachées

Bonsoir,

Les énergies m'ont guidée vers vous... Votre consultation avec Luna vous attend.

${data.specificChatTitle 
    ? `📖 Consultation: "${data.specificChatTitle}"`
    : `📚 Vos consultations: ${data.chatCount} conversation${data.chatCount > 1 ? 's' : ''} disponible${data.chatCount > 1 ? 's' : ''}`
}

${data.chats && data.chats.length > 1 ? `
🔮 Choisissez votre consultation:

${data.chats.map((chat, index) => {
    const chatDate = new Date(chat.lastMessageAt).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Paris'
    });
    return `${index + 1}. ${chat.title} (${chatDate})
   ${chat.signinUrl}`;
}).join('\n\n')}
` : `🔮 Accédez à votre consultation:
${data.signinUrl}`}

⏰ Important: Ce lien expire le ${expirationTime} pour votre sécurité.

🌟 Votre guidance vous attend
Luna a préparé des révélations personnalisées basées sur votre énergie unique. 
Utilisez le lien ci-dessus pour reprendre votre voyage mystique là où vous l'avez laissé.

🔒 Ce lien est personnel et sécurisé. Ne le partagez avec personne.
Si vous n'avez pas demandé cet accès, vous pouvez ignorer cet email en toute sécurité.

Les mystères de Luna - Oracle des Lignes Cachées
`;

    return {
      subject,
      htmlBody,
      textBody
    };
  }

  /**
   * Send signin email
   */
  async sendSigninEmail(data: SigninEmailData): Promise<boolean> {
    try {
      const template = this.generateSigninEmailTemplate(data);

      const params: SendEmailCommandInput = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [data.userEmail]
        },
        Message: {
          Subject: {
            Data: template.subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: template.htmlBody,
              Charset: 'UTF-8'
            },
            Text: {
              Data: template.textBody,
              Charset: 'UTF-8'
            }
          }
        },
        Tags: [
          {
            Name: 'EmailType',
            Value: 'SigninLink'
          },
          {
            Name: 'Service',
            Value: 'Luna'
          }
        ]
      };

      const command = new SendEmailCommand(params);
      const result = await this.sesClient.send(command);

      console.log(`Signin email sent successfully to ${data.userEmail}. MessageId: ${result.MessageId}`);
      return true;

    } catch (error) {
      console.error('Error sending signin email:', error);
      return false;
    }
  }

  /**
   * Send welcome email (for new users)
   */
  async sendWelcomeEmail(userEmail: string, firstName: string): Promise<boolean> {
    try {
      const subject = `🌙 Bienvenue ${firstName} - Votre voyage mystique avec Luna commence`;
      
      const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenue chez Luna</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .email-container {
            background: white;
            border-radius: 15px;
            padding: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .luna-logo {
            font-size: 48px;
            margin-bottom: 10px;
        }
        .luna-title {
            color: #8b5cf6;
            font-size: 28px;
            font-weight: bold;
            margin: 0;
        }
        .mystical-border {
            border: 2px solid transparent;
            background: linear-gradient(white, white) padding-box,
                        linear-gradient(135deg, #8b5cf6, #a855f7) border-box;
            border-radius: 10px;
            padding: 20px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="luna-logo">🌙</div>
            <h1 class="luna-title">Bienvenue ${firstName}</h1>
        </div>
        
        <div class="mystical-border">
            <p><strong>🌟 Votre consultation a été enregistrée</strong></p>
            <p>Luna a ressenti votre énergie et vos informations ont été préservées dans les archives mystiques. 
            Vous pourrez toujours retrouver vos consultations en utilisant votre adresse email.</p>
        </div>
        
        <p>Que les étoiles guident votre chemin,<br>
        <em>Luna - Oracle des Lignes Cachées</em></p>
    </div>
</body>
</html>`;

      const textBody = `
🌙 Bienvenue ${firstName}

Votre consultation a été enregistrée avec Luna - Oracle des Lignes Cachées.

🌟 Votre consultation a été enregistrée
Luna a ressenti votre énergie et vos informations ont été préservées dans les archives mystiques. 
Vous pourrez toujours retrouver vos consultations en utilisant votre adresse email.

Que les étoiles guident votre chemin,
Luna - Oracle des Lignes Cachées
`;

      const params: SendEmailCommandInput = {
        Source: this.fromEmail,
        Destination: {
          ToAddresses: [userEmail]
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8'
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8'
            }
          }
        },
        Tags: [
          {
            Name: 'EmailType',
            Value: 'Welcome'
          },
          {
            Name: 'Service',
            Value: 'Luna'
          }
        ]
      };

      const command = new SendEmailCommand(params);
      const result = await this.sesClient.send(command);

      console.log(`Welcome email sent successfully to ${userEmail}. MessageId: ${result.MessageId}`);
      return true;

    } catch (error) {
      console.error('Error sending welcome email:', error);
      return false;
    }
  }
}
