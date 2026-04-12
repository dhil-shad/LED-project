import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function ContactModal({ isOpen, onClose }) {
    const overlayRef = useRef(null);
    const modalRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 });
            gsap.fromTo(modalRef.current,
                { y: 50, autoAlpha: 0, scale: 0.95 },
                { y: 0, autoAlpha: 1, scale: 1, duration: 0.5, ease: 'back.out(1.5)', delay: 0.1 }
            );
            document.body.style.overflow = 'hidden';
        } else if (overlayRef.current) {
            gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.3 });
            gsap.to(modalRef.current, { y: 20, autoAlpha: 0, scale: 0.95, duration: 0.3 });
            document.body.style.overflow = '';
        }
    }, [isOpen]);

    return (
        <div
            className={`modal-overlay ${isOpen ? 'active' : ''}`}
            ref={overlayRef}
            style={{ visibility: 'hidden' }}
        >
            <div className="modal-backdrop" onClick={onClose}></div>
            <div className="modal-content skeuo-panel" ref={modalRef}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <h2 className="engraved-text" style={{ fontSize: '2rem' }}>Request a Quote</h2>
                <p className="inset-text" style={{ fontSize: '1rem', marginBottom: '1.5rem' }}>
                    Fill in your details and project scope. Our experts will get back to you immediately.
                </p>
                <form className="contact-form" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
                    <div className="form-group">
                        <input type="text" placeholder="Full Name" required />
                    </div>
                    <div className="form-group">
                        <input type="email" placeholder="Business Email" required />
                    </div>
                    <div className="form-group">
                        <select required>
                            <option value="">Interested In...</option>
                            <option value="rental">LED Rental</option>
                            <option value="purchase">Permanent Install / Purchase</option>
                            <option value="custom">Custom Build</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <textarea placeholder="Project Details (optional)" rows="3"></textarea>
                    </div>
                    <button type="submit" className="skeuo-btn option-btn highlighted" style={{ width: '100%' }}>
                        Submit Request
                    </button>
                </form>
            </div>
        </div>
    );
}
