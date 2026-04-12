import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function Header() {
    const ctaRef = useRef(null);

    useEffect(() => {
        // Magnetic logic for the CTA button
        const btn = ctaRef.current;
        if (!btn) return;

        const onMouseMove = (e) => {
            const rect = btn.getBoundingClientRect();
            const h = rect.width / 2;
            const w = rect.height / 2;
            // Mouse coordinates relative to the center of the button
            const x = e.clientX - rect.left - h;
            const y = e.clientY - rect.top - w;

            gsap.to(btn, {
                x: x * 0.3,
                y: y * 0.3,
                duration: 0.4,
                ease: 'power2.out',
            });
        };

        const onMouseLeave = () => {
            gsap.to(btn, {
                x: 0,
                y: 0,
                duration: 0.7,
                ease: 'elastic.out(1, 0.3)',
            });
        };

        btn.addEventListener('mousemove', onMouseMove);
        btn.addEventListener('mouseleave', onMouseLeave);

        return () => {
            btn.removeEventListener('mousemove', onMouseMove);
            btn.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []);

    return (
        <header className="site-header">
            <div className="header-container">
                <div className="logo">
                    LOOFIX <span className="dot">.</span>
                </div>
                <nav className="nav-links">
                    <a href="#home">Home</a>
                    <a href="#products">Products</a>
                    <a href="#specs">Tech Specs</a>
                </nav>
                <button ref={ctaRef} className="header-cta" onClick={() => document.getElementById('enquiry').scrollIntoView({ behavior: 'smooth' })}>
                    Let's Talk
                </button>
            </div>
        </header>
    );
}
