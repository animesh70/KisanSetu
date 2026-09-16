import { Github, Instagram, Leaf, Linkedin, Mail, MapPin, Truck, Users } from 'lucide-react';

const footerNav = [
  ['Home', '#dashboard'],
  ['Dashboard', '#dashboard'],
  ['Market prices', '#market-prices'],
  ['My crop lots', '#crop-lots'],
  ['Buyer matches', '#buyer-matches'],
  ['Logistics', '#logistics'],
  ['Equipment sharing', '#equipment-sharing'],
  ['Transactions', '#transactions'],
  ['Contact', 'mailto:animeshmohanty59@gmail.com']
];

export default function KisanFooter() {
  return (
    <footer className="kisan-footer" aria-label="KisanSetu footer">
      <div className="kisan-footer-shade" />
      <div className="kisan-footer-art kisan-footer-art-left" aria-hidden="true">
        <span>From</span>
        <span>Our Fields</span>
        <span>to a Brighter</span>
        <span>Tomorrow</span>
        <i />
      </div>

      <div className="kisan-footer-content">
        <section className="kisan-footer-brand">
          <div className="kisan-footer-logo"><span><Leaf size={25}/></span><strong>Kisan<span>Setu</span></strong></div>
          <p>Helping farmers with better price discovery, buyer matching, logistics, and equipment sharing.</p>
          <div className="kisan-footer-contact">
            <a href="mailto:animeshmohanty59@gmail.com"><Mail size={15}/>animeshmohanty59@gmail.com</a>
            <span><MapPin size={15}/>Bhubaneswar, Odisha, India</span>
            <span className="kisan-footer-status"><i/>Open for collaboration</span>
          </div>
          <div className="kisan-footer-socials" aria-label="Social links">
            <a href="https://github.com/animesh70" target="_blank" rel="noreferrer" aria-label="GitHub"><Github size={18}/></a>
            <a href="https://www.linkedin.com/in/animeshmohanty70/" target="_blank" rel="noreferrer" aria-label="LinkedIn"><Linkedin size={18}/></a>
            <a href="mailto:animeshmohanty59@gmail.com" aria-label="Email"><Mail size={18}/></a>
            <a href="https://www.instagram.com/sparke.pvt/" target="_blank" rel="noreferrer" aria-label="Instagram"><Instagram size={18}/></a>
          </div>
        </section>

        <section className="kisan-footer-nav">
          <h3>Navigation</h3>
          <nav>
            {footerNav.map(([label, href]) => <a key={label} href={href}>{label}</a>)}
          </nav>
        </section>

        <section className="kisan-footer-impact">
          <h3>Our Impact</h3>
          <div className="kisan-impact-item"><span><Leaf size={19}/></span><div><strong>Better Prices</strong><small>For a fairer tomorrow</small></div></div>
          <div className="kisan-impact-item"><span><Users size={19}/></span><div><strong>Stronger Communities</strong><small>Farmers, buyers, together</small></div></div>
          <div className="kisan-impact-item"><span><Truck size={19}/></span><div><strong>Sustainable Supply Chains</strong><small>From farm to future</small></div></div>
        </section>
      </div>

      <div className="kisan-footer-art kisan-footer-art-right" aria-hidden="true">
        <span>Support</span><span>Local</span><span>Grow Global</span><i/>
      </div>

      <div className="kisan-footer-bottom">
        <p>© 2026 KisanSetu · <a href="https://github.com/animesh70" target="_blank" rel="noreferrer">animesh70</a> · <a href="https://github.com/animesh70" target="_blank" rel="noreferrer">github.com/animesh70</a></p>
        <p>Cultivating Connections <Leaf size={14}/></p>
      </div>
    </footer>
  );
}
