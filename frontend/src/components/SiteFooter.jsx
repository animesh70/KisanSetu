import { Github, Instagram, Leaf, Linkedin, Mail, MapPin, Truck, Users } from 'lucide-react';

const navigation = [
  ['Home', 'Dashboard'],
  ['Dashboard', 'Dashboard'],
  ['Market prices', 'Market prices'],
  ['My crop lots', 'My crop lots'],
  ['Buyer matches', 'Buyer matches'],
  ['Direct marketplace', 'Direct marketplace'],
  ['Logistics', 'Logistics'],
  ['Equipment sharing', 'Equipment sharing'],
  ['Transactions', 'Transactions']
];

export default function SiteFooter({ onNavigate }) {
  return (
    <footer className="site-footer" aria-label="KisanSetu footer">
      <div className="site-footer-art site-footer-art-left" aria-hidden="true" />
      <div className="site-footer-art site-footer-art-right" aria-hidden="true" />

      <div className="site-footer-main">
        <div className="site-footer-art-spacer" aria-hidden="true" />

        <section className="site-footer-brand">
          <div className="site-footer-logo">
            <span><Leaf size={25} /></span>
            <strong>Kisan<span>Setu</span></strong>
          </div>
          <p>Helping farmers with better price discovery, buyer matching, logistics, and equipment sharing.</p>
          <div className="site-footer-contact">
            <a href="mailto:animeshmohanty59@gmail.com"><Mail size={16}/>animeshmohanty59@gmail.com</a>
            <span><MapPin size={16}/>Bhubaneswar, Odisha, India</span>
            <span className="site-footer-status"><i/>Open for collaboration</span>
          </div>
          <div className="site-footer-socials" aria-label="Social links">
            <a href="https://github.com/animesh70" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={20}/></a>
            <a href="https://www.linkedin.com/in/animeshmohanty70/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={20}/></a>
            <a href="mailto:animeshmohanty59@gmail.com" aria-label="Email"><Mail size={20}/></a>
            <a href="https://www.instagram.com/sparke.pvt/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={20}/></a>
          </div>
        </section>

        <section className="site-footer-column site-footer-navigation">
          <h3>Navigation</h3>
          <div>
            {navigation.map(([text, destination]) => (
              <button key={text} type="button" onClick={() => onNavigate?.(destination)}>{text}</button>
            ))}
            <a href="mailto:animeshmohanty59@gmail.com">Contact</a>
          </div>
        </section>

        <section className="site-footer-column site-footer-impact">
          <h3>Our Impact</h3>
          <div className="impact-item"><span><Leaf size={19}/></span><div><strong>Better Prices</strong><small>For a fairer tomorrow</small></div></div>
          <div className="impact-item"><span><Users size={19}/></span><div><strong>Stronger Communities</strong><small>Farmers, buyers, together</small></div></div>
          <div className="impact-item"><span><Truck size={19}/></span><div><strong>Sustainable Supply Chains</strong><small>From farm to future</small></div></div>
        </section>
      </div>

      <div className="site-footer-bottom">
        <span>© 2026 KisanSetu · <a href="https://github.com/animesh70" target="_blank" rel="noreferrer">animesh70</a> · <a href="https://github.com/animesh70" target="_blank" rel="noreferrer">github.com/animesh70</a></span>
        <span>Cultivating Connections <Leaf size={15}/></span>
      </div>
    </footer>
  );
}
