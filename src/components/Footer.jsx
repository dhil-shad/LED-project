import React from 'react';

export default function Footer() {
    return (
        <footer className="site-footer">
            <div className="footer-top">
                <div className="footer-brand">
                    <h2 className="footer-logo">LOOFIX</h2>
                    <p>Global suppliers of premium, immersive LED modular wall displays.</p>
                </div>
                <div className="footer-links">
                    <div className="link-group">
                        <h4>Solutions</h4>
                        <a href="#">Indoor LED</a>
                        <a href="#">Outdoor Billboards</a>
                        <a href="#">Rental Panels</a>
                        <a href="#">Custom Stages</a>
                    </div>
                    <div className="link-group">
                        <h4>Company</h4>
                        <a href="#">About Us</a>
                        <a href="#">Case Studies</a>
                        <a href="#">Careers</a>
                        <a href="#">Contact</a>
                    </div>
                </div>
            </div>
            <div className="footer-bottom">
                <div className="footer-copyright">
                    &copy; {new Date().getFullYear()} Loofix Technologies. All rights reserved.
                </div>
                <div className="footer-socials">
                    <a href="#">LinkedIn</a>
                    <a href="#">Instagram</a>
                    <a href="#">Twitter</a>
                </div>
            </div>
        </footer>
    );
}
