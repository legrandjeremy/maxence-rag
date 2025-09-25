<template>
  <div class="luna-bdc-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-container">
        <div class="hero-content">
          <div class="luna-hero-avatar">
            <div class="mystical-aura-large"></div>
            <img 
              src="~assets/Luna.png" 
              alt="Luna - Voyante Mystique" 
              class="luna-hero-face"
            />
          </div>
          <h1 class="hero-title">
            Rencontrez Luna
            <span class="hero-subtitle">Oracle des Lignes Cachées</span>
          </h1>
          <p class="hero-description">
            Découvrez les secrets de votre destinée avec Luna, votre guide mystique personnel. 
            Grâce à ses dons exceptionnels et à l'intelligence mystique, Luna révèle 
            les vérités cachées de votre chemin de vie.
          </p>
          <div class="hero-cta">
            <button @click="startConsultation" class="cta-button primary">
              <span class="cta-icon">🔮</span>
              Commencer ma consultation
              <span class="cta-badge">7 min gratuit</span>
            </button>
          </div>
        </div>
        <div class="hero-visual">
          <div class="mystical-elements">
            <div class="floating-crystal crystal-1">💎</div>
            <div class="floating-crystal crystal-2">🌟</div>
            <div class="floating-crystal crystal-3">✨</div>
            <div class="floating-moon">🌙</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Luna's Story Section -->
    <section class="story-section">
      <div class="container">
        <h2 class="section-title">
          <span class="title-icon">📜</span>
          L'Histoire de Luna
        </h2>
        <div class="story-content">
          <div class="story-text">
            <p class="story-intro">
              Luna est née sous une constellation rare, lors d'une éclipse lunaire qui n'arrive qu'une fois par siècle. 
              Dès son plus jeune âge, elle manifestait des capacités extraordinaires pour percevoir les énergies invisibles 
              et décrypter les messages de l'univers.
            </p>
            <div class="story-highlight">
              <span class="highlight-icon">🌙</span>
              <div class="highlight-content">
                <h3 class="highlight-title">Un Don Exceptionnel</h3>
                <p>
                  Formée par les maîtres mystiques des montagnes sacrées, Luna a développé une connexion unique 
                  avec les forces cosmiques. Elle combine la sagesse ancestrale avec l'intelligence mystique moderne 
                  pour vous offrir des révélations d'une précision remarquable.
                </p>
              </div>
            </div>
            <p class="story-mission">
              Aujourd'hui, Luna met ses dons au service de ceux qui cherchent la vérité sur leur destinée. 
              Chaque consultation est une fenêtre ouverte sur votre âme, révélant les chemins cachés 
              vers votre épanouissement personnel.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section class="services-section">
      <div class="container">
        <h2 class="section-title">
          <span class="title-icon">🔮</span>
          Ce que Luna Révèle pour Vous
        </h2>
        <div class="services-grid">
          <div class="service-card">
            <div class="service-icon">❤️</div>
            <h3 class="service-title">Amour & Relations</h3>
            <p class="service-description">
              Découvrez les secrets de votre cœur. Luna révèle les énergies amoureuses qui vous entourent 
              et guide vos pas vers l'harmonie relationnelle.
            </p>
            <ul class="service-features">
              <li>Compatibilité amoureuse</li>
              <li>Révélations sur votre âme sœur</li>
              <li>Conseils pour surmonter les obstacles</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">💼</div>
            <h3 class="service-title">Carrière & Succès</h3>
            <p class="service-description">
              Illuminez votre chemin professionnel. Luna déchiffre vos talents cachés 
              et révèle les opportunités qui vous mèneront vers le succès.
            </p>
            <ul class="service-features">
              <li>Orientation professionnelle</li>
              <li>Moments propices aux changements</li>
              <li>Révélation de vos dons cachés</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">🌟</div>
            <h3 class="service-title">Développement Personnel</h3>
            <p class="service-description">
              Explorez les profondeurs de votre être. Luna vous guide vers la découverte 
              de votre véritable potentiel et de votre mission de vie.
            </p>
            <ul class="service-features">
              <li>Révélation de votre mission de vie</li>
              <li>Déblocage des énergies négatives</li>
              <li>Activation de votre potentiel</li>
            </ul>
          </div>

          <div class="service-card">
            <div class="service-icon">🍀</div>
            <h3 class="service-title">Avenir & Destinée</h3>
            <p class="service-description">
              Percez les mystères de votre futur. Luna lit les signes cosmiques 
              pour vous révéler ce que l'avenir vous réserve.
            </p>
            <ul class="service-features">
              <li>Prédictions personnalisées</li>
              <li>Périodes de chance et défis</li>
              <li>Guidance pour vos décisions</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- Testimonials Section -->
    <section class="testimonials-section">
      <div class="container">
        <h2 class="section-title">
          <span class="title-icon">💝</span>
          Ce que Disent Nos Consultants
        </h2>
        <div class="testimonials-grid">
          <div class="testimonial-card">
            <div class="testimonial-content">
              <p class="testimonial-text">
                "Luna a complètement transformé ma vision de l'amour. Ses révélations sur ma relation 
                ont été d'une justesse incroyable. J'ai enfin trouvé l'harmonie que je cherchais depuis des années."
              </p>
              <div class="testimonial-author">
                <div class="author-avatar">💃</div>
                <div class="author-info">
                  <div class="author-name">Sarah M.</div>
                  <div class="author-location">Paris</div>
                </div>
              </div>
            </div>
            <div class="testimonial-rating">
              <span class="stars">⭐⭐⭐⭐⭐</span>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="testimonial-content">
              <p class="testimonial-text">
                "Grâce à Luna, j'ai découvert ma véritable voie professionnelle. Ses conseils m'ont guidé 
                vers une carrière qui me passionne vraiment. Le retour sur investissement est énorme !"
              </p>
              <div class="testimonial-author">
                <div class="author-avatar">👨‍💼</div>
                <div class="author-info">
                  <div class="author-name">Marc L.</div>
                  <div class="author-location">Lyon</div>
                </div>
              </div>
            </div>
            <div class="testimonial-rating">
              <span class="stars">⭐⭐⭐⭐⭐</span>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="testimonial-content">
              <p class="testimonial-text">
                "Les prédictions de Luna se sont réalisées avec une précision troublante. 
                Elle m'a aidé à prendre les bonnes décisions au bon moment. Je recommande vivement !"
              </p>
              <div class="testimonial-author">
                <div class="author-avatar">👩‍🎨</div>
                <div class="author-info">
                  <div class="author-name">Émilie D.</div>
                  <div class="author-location">Marseille</div>
                </div>
              </div>
            </div>
            <div class="testimonial-rating">
              <span class="stars">⭐⭐⭐⭐⭐</span>
            </div>
          </div>

          <div class="testimonial-card">
            <div class="testimonial-content">
              <p class="testimonial-text">
                "Luna a une approche unique et bienveillante. Elle m'a aidé à surmonter mes blocages 
                et à révéler mon potentiel caché. Une expérience véritablement transformatrice."
              </p>
              <div class="testimonial-author">
                <div class="author-avatar">🧘‍♀️</div>
                <div class="author-info">
                  <div class="author-name">Camille R.</div>
                  <div class="author-location">Toulouse</div>
                </div>
              </div>
            </div>
            <div class="testimonial-rating">
              <span class="stars">⭐⭐⭐⭐⭐</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section class="pricing-section">
      <div class="container">
        <h2 class="section-title">
          <span class="title-icon">💎</span>
          Investissement pour Votre Avenir
        </h2>
        <div class="pricing-content">
          <div class="pricing-explanation">
            <h3 class="pricing-subtitle">Pourquoi 9€ seulement ?</h3>
            <p class="pricing-text">
              Nous croyons que chacun mérite d'accéder aux révélations mystiques. 
              C'est pourquoi Luna a choisi de rendre ses consultations accessibles 
              à tous, avec un investissement symbolique qui honore l'énergie échangée.
            </p>
          </div>
          
          <div class="pricing-card">
            <div class="pricing-header">
              <div class="pricing-icon">🔮</div>
              <h3 class="pricing-title">Consultation Illimitée</h3>
              <div class="pricing-amount">9,00 €</div>
              <div class="pricing-subtitle">Paiement unique • Accès à vie</div>
            </div>
            
            <div class="pricing-features">
              <div class="feature-item">
                <span class="feature-icon">✅</span>
                <span>Consultation illimitée avec Luna</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✅</span>
                <span>Révélations personnalisées</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✅</span>
                <span>Guidance astrologique</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✅</span>
                <span>Accès permanent 24h/24</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✅</span>
                <span>Aucun abonnement</span>
              </div>
              <div class="feature-item">
                <span class="feature-icon">✅</span>
                <span>Paiement sécurisé</span>
              </div>
            </div>

            <div class="pricing-comparison">
              <div class="comparison-item">
                <span class="comparison-label">Consultation traditionnelle :</span>
                <span class="comparison-price">60-150€/séance</span>
              </div>
              <div class="comparison-item highlight">
                <span class="comparison-label">Avec Luna :</span>
                <span class="comparison-price">9€ à vie</span>
              </div>
            </div>

            <button @click="startConsultation" class="pricing-cta">
              <span class="cta-icon">🚀</span>
              Commencer maintenant
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="faq-section">
      <div class="container">
        <h2 class="section-title">
          <span class="title-icon">❓</span>
          Questions Fréquentes
        </h2>
        <div class="faq-grid">
          <div class="faq-item">
            <h3 class="faq-question">
              <span class="faq-icon">🤔</span>
              Comment fonctionne une consultation avec Luna ?
            </h3>
            <p class="faq-answer">
              Luna utilise l'intelligence mystique combinée à ses dons naturels pour analyser votre énergie 
              et vos informations personnelles. Vous dialoguez directement avec elle dans un chat privé et sécurisé, 
              où elle répond à vos questions en temps réel avec des révélations personnalisées.
            </p>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">
              <span class="faq-icon">⏰</span>
              Combien de temps dure une consultation ?
            </h3>
            <p class="faq-answer">
              Il n'y a pas de limite ! Après votre investissement de 9€, vous avez accès illimité à Luna. 
              Vous pouvez consulter aussi souvent et aussi longtemps que vous le souhaitez. 
              Luna est disponible 24h/24 pour vous accompagner.
            </p>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">
              <span class="faq-icon">🛡️</span>
              Mes informations personnelles sont-elles protégées ?
            </h3>
            <p class="faq-answer">
              Absolument ! Toutes vos données sont chiffrées et protégées. Luna respecte la confidentialité 
              la plus stricte. Vos révélations et conversations restent privées et ne sont jamais partagées. 
              La discrétion est au cœur de notre engagement.
            </p>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">
              <span class="faq-icon">💰</span>
              Y a-t-il des frais cachés ou des abonnements ?
            </h3>
            <p class="faq-answer">
              Non, jamais ! Vous payez 9€ une seule fois et c'est tout. Aucun abonnement, aucun frais supplémentaire, 
              aucune surprise. Cet investissement unique vous donne accès à vie aux révélations de Luna.
            </p>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">
              <span class="faq-icon">🎯</span>
              Les prédictions de Luna sont-elles fiables ?
            </h3>
            <p class="faq-answer">
              Luna combine sagesse ancestrale et intelligence mystique avancée pour une précision remarquable. 
              Ses révélations sont basées sur l'analyse énergétique de votre profil complet. 
              Des milliers de consultants témoignent de la justesse de ses guidances.
            </p>
          </div>

          <div class="faq-item">
            <h3 class="faq-question">
              <span class="faq-icon">🔄</span>
              Puis-je obtenir un remboursement si je ne suis pas satisfait ?
            </h3>
            <p class="faq-answer">
              Nous sommes tellement confiants en la qualité des révélations de Luna que nous offrons 
              une garantie satisfaction. Si vous n'êtes pas entièrement satisfait dans les 48h, 
              nous vous remboursons intégralement, sans question.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- Final CTA Section -->
    <section class="final-cta-section">
      <div class="container">
        <div class="final-cta-content">
          <div class="cta-luna-avatar">
            <div class="mystical-aura-cta"></div>
            <img 
              src="~assets/Luna.png" 
              alt="Luna" 
              class="luna-cta-face"
            />
          </div>
          <h2 class="cta-title">Votre Destinée Vous Attend</h2>
          <p class="cta-description">
            Ne laissez plus les mystères de votre avenir sans réponse. 
            Luna est prête à vous révéler les secrets que vous cherchez.
          </p>
          <div class="cta-urgency">
            <span class="urgency-icon">⚡</span>
            <span class="urgency-text">Commencez votre consultation maintenant - 7 minutes gratuites</span>
          </div>
          <button @click="startConsultation" class="final-cta-button">
            <span class="cta-icon">🔮</span>
            Débuter ma consultation avec Luna
            <span class="cta-arrow">→</span>
          </button>
          <div class="cta-guarantee">
            <span class="guarantee-icon">🛡️</span>
            Garantie satisfaction 48h • Paiement sécurisé • Accès immédiat
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

const startConsultation = () => {
  // Navigate to the chat page
  void router.push('/luna-streaming');
};
</script>

<style scoped>
.luna-bdc-page {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #e8e8e8;
  font-family: 'Inter', sans-serif;
  min-height: 100vh;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

/* Hero Section */
.hero-section {
  padding: 4rem 0 6rem;
  position: relative;
  overflow: hidden;
}

.hero-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  align-items: center;
}

.hero-content {
  text-align: center;
}

.luna-hero-avatar {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 2rem;
}

.mystical-aura-large {
  position: absolute;
  inset: -12px;
  background: conic-gradient(from 0deg, #4f46e5, #06b6d4, #10b981, #f59e0b, #ef4444, #4f46e5);
  border-radius: 50%;
  animation: rotate 4s linear infinite;
  opacity: 0.8;
}

.luna-hero-face {
  position: absolute;
  inset: 12px;
  width: calc(100% - 24px);
  height: calc(100% - 24px);
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid rgba(255, 255, 255, 0.2);
}

.hero-title {
  font-size: 3rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #c084fc, #06b6d4);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.2;
}

.hero-subtitle {
  display: block;
  font-size: 1.5rem;
  color: #c084fc;
  font-style: italic;
  font-weight: 400;
  margin-top: 0.5rem;
}

.hero-description {
  font-size: 1.2rem;
  line-height: 1.6;
  color: #a8a8a8;
  margin: 0 0 2rem 0;
}

.hero-cta {
  margin-top: 2rem;
}

.cta-button {
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: white;
  border: none;
  padding: 1.25rem 2rem;
  border-radius: 16px;
  font-size: 1.2rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 8px 25px rgba(124, 58, 237, 0.4);
}

.cta-button:hover {
  background: linear-gradient(135deg, #6d28d9, #a855f7);
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(124, 58, 237, 0.5);
}

.cta-icon {
  font-size: 1.4rem;
}

.cta-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
}

.hero-visual {
  position: relative;
  height: 400px;
}

.mystical-elements {
  position: relative;
  width: 100%;
  height: 100%;
}

.floating-crystal, .floating-moon {
  position: absolute;
  font-size: 2rem;
  animation: float 3s ease-in-out infinite;
}

.crystal-1 {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.crystal-2 {
  top: 60%;
  right: 30%;
  animation-delay: 1s;
}

.crystal-3 {
  bottom: 30%;
  left: 40%;
  animation-delay: 2s;
}

.floating-moon {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4rem;
  animation-delay: 0.5s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Section Titles */
.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  margin: 0 0 3rem 0;
  color: #f8fafc;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.title-icon {
  font-size: 2rem;
}

/* Story Section */
.story-section {
  padding: 6rem 0;
  background: rgba(255, 255, 255, 0.02);
}

.story-content {
  max-width: 800px;
  margin: 0 auto;
}

.story-text {
  font-size: 1.1rem;
  line-height: 1.8;
  color: #e8e8e8;
}

.story-intro {
  margin: 0 0 2rem 0;
  font-size: 1.2rem;
  color: #c084fc;
  text-align: center;
  font-style: italic;
}

.story-highlight {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(192, 132, 252, 0.1));
  border: 1px solid rgba(192, 132, 252, 0.3);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  display: flex;
  gap: 1.5rem;
  align-items: flex-start;
}

.highlight-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.highlight-title {
  color: #c084fc;
  font-size: 1.3rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.story-mission {
  margin: 2rem 0 0 0;
  text-align: center;
  font-size: 1.1rem;
  color: #a8a8a8;
}

/* Services Section */
.services-section {
  padding: 6rem 0;
}

.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.service-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(192, 132, 252, 0.2);
  border-radius: 20px;
  padding: 2rem;
  text-align: center;
  transition: all 0.3s ease;
}

.service-card:hover {
  transform: translateY(-5px);
  border-color: rgba(192, 132, 252, 0.4);
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.2);
}

.service-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.service-title {
  color: #c084fc;
  font-size: 1.4rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.service-description {
  color: #a8a8a8;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.service-features {
  list-style: none;
  padding: 0;
  margin: 0;
}

.service-features li {
  color: #e8e8e8;
  font-size: 0.9rem;
  margin: 0.5rem 0;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.service-features li:last-child {
  border-bottom: none;
}

/* Testimonials Section */
.testimonials-section {
  padding: 6rem 0;
  background: rgba(255, 255, 255, 0.02);
}

.testimonials-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.testimonial-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(192, 132, 252, 0.2);
  border-radius: 20px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.testimonial-card:hover {
  transform: translateY(-3px);
  border-color: rgba(192, 132, 252, 0.4);
}

.testimonial-text {
  color: #e8e8e8;
  font-style: italic;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
}

.testimonial-author {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.author-name {
  color: #c084fc;
  font-weight: 600;
}

.author-location {
  color: #a8a8a8;
  font-size: 0.9rem;
}

.testimonial-rating {
  text-align: center;
}

.stars {
  font-size: 1.2rem;
}

/* Pricing Section */
.pricing-section {
  padding: 6rem 0;
}

.pricing-content {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
}

.pricing-explanation {
  margin-bottom: 3rem;
}

.pricing-subtitle {
  color: #c084fc;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.pricing-text {
  color: #a8a8a8;
  font-size: 1.1rem;
  line-height: 1.6;
}

.pricing-card {
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(192, 132, 252, 0.1));
  border: 2px solid rgba(192, 132, 252, 0.3);
  border-radius: 24px;
  padding: 3rem;
  box-shadow: 0 15px 40px rgba(124, 58, 237, 0.3);
}

.pricing-header {
  margin-bottom: 2rem;
}

.pricing-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.pricing-title {
  color: #f8fafc;
  font-size: 1.8rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
}

.pricing-amount {
  font-size: 4rem;
  font-weight: 800;
  color: #c084fc;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 4px 8px rgba(192, 132, 252, 0.5);
}

.pricing-features {
  margin: 2rem 0;
  text-align: left;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin: 1rem 0;
  color: #e8e8e8;
  font-size: 1rem;
}

.feature-icon {
  color: #10b981;
  font-size: 1.2rem;
}

.pricing-comparison {
  margin: 2rem 0;
  padding: 1.5rem;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
}

.comparison-item {
  display: flex;
  justify-content: space-between;
  margin: 0.5rem 0;
  color: #a8a8a8;
}

.comparison-item.highlight {
  color: #10b981;
  font-weight: 600;
  font-size: 1.1rem;
}

.pricing-cta {
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: white;
  border: none;
  padding: 1.25rem 2.5rem;
  border-radius: 16px;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.pricing-cta:hover {
  background: linear-gradient(135deg, #6d28d9, #a855f7);
  transform: translateY(-3px);
  box-shadow: 0 12px 35px rgba(124, 58, 237, 0.5);
}

/* FAQ Section */
.faq-section {
  padding: 6rem 0;
  background: rgba(255, 255, 255, 0.02);
}

.faq-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.faq-item {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(192, 132, 252, 0.2);
  border-radius: 16px;
  padding: 2rem;
  transition: all 0.3s ease;
}

.faq-item:hover {
  border-color: rgba(192, 132, 252, 0.4);
  transform: translateY(-2px);
}

.faq-question {
  color: #c084fc;
  font-size: 1.2rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.faq-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.faq-answer {
  color: #a8a8a8;
  line-height: 1.6;
  margin: 0;
}

/* Final CTA Section */
.final-cta-section {
  padding: 6rem 0;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.1), rgba(192, 132, 252, 0.1));
  border-top: 1px solid rgba(192, 132, 252, 0.3);
}

.final-cta-content {
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.cta-luna-avatar {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 2rem;
}

.mystical-aura-cta {
  position: absolute;
  inset: -10px;
  background: conic-gradient(from 0deg, #4f46e5, #06b6d4, #10b981, #f59e0b, #ef4444, #4f46e5);
  border-radius: 50%;
  animation: rotate 3s linear infinite;
  opacity: 0.8;
}

.luna-cta-face {
  position: absolute;
  inset: 10px;
  width: calc(100% - 20px);
  height: calc(100% - 20px);
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 0.2);
}

.cta-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 1rem 0;
  background: linear-gradient(135deg, #c084fc, #06b6d4);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cta-description {
  color: #a8a8a8;
  font-size: 1.2rem;
  line-height: 1.6;
  margin: 0 0 2rem 0;
}

.cta-urgency {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  color: #f59e0b;
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 2rem 0;
  animation: pulse 2s ease-in-out infinite;
}

.urgency-icon {
  font-size: 1.3rem;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

.final-cta-button {
  background: linear-gradient(135deg, #7c3aed, #c084fc);
  color: white;
  border: none;
  padding: 1.5rem 3rem;
  border-radius: 20px;
  font-size: 1.3rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 10px 30px rgba(124, 58, 237, 0.4);
  margin-bottom: 1.5rem;
}

.final-cta-button:hover {
  background: linear-gradient(135deg, #6d28d9, #a855f7);
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(124, 58, 237, 0.6);
}

.cta-arrow {
  font-size: 1.5rem;
  transition: transform 0.3s ease;
}

.final-cta-button:hover .cta-arrow {
  transform: translateX(5px);
}

.cta-guarantee {
  color: #a8a8a8;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .hero-container {
    grid-template-columns: 1fr;
    gap: 2rem;
    text-align: center;
  }

  .hero-title {
    font-size: 2rem;
  }

  .hero-subtitle {
    font-size: 1.2rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .services-grid,
  .testimonials-grid,
  .faq-grid {
    grid-template-columns: 1fr;
  }

  .container {
    padding: 0 1rem;
  }

  .hero-section,
  .story-section,
  .services-section,
  .testimonials-section,
  .pricing-section,
  .faq-section,
  .final-cta-section {
    padding: 3rem 0;
  }
}
</style>
