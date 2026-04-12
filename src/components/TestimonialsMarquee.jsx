import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

const logos = [
    "Global LED", "Visionary Displays", "Tech Stage", "CinemaX Pro",
    "LiveCast Events", "Neon Future", "Global LED", "Visionary Displays"
];

export default function TestimonialsMarquee() {
    return (
        <section className="marquee-section">
            <div className="marquee-header">
                <span className="accent-tag">Trusted By Industry Leaders</span>
            </div>
            <div className="marquee-container">
                <div className="marquee-track">
                    {/* Double the list to loop seamlessly */}
                    {[...logos, ...logos].map((logo, idx) => (
                        <div key={idx} className="marquee-item">
                            <div className="logo-placeholder">
                                <span className="dot"></span> {logo}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
