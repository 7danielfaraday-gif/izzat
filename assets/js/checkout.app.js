document.addEventListener('DOMContentLoaded', function(){
    try {
        if (typeof setupKeyboardDetection === 'function') setupKeyboardDetection();
        else if (typeof window.setupKeyboardDetection === 'function') window.setupKeyboardDetection();
    } catch(e) {}
});
    
    window.initReactCheckout = function() {
        if (window.checkoutInitialized) return;
        if (typeof React === 'undefined' || typeof ReactDOM === 'undefined') {
            setTimeout(window.initReactCheckout, 50); 
            return;
        }
        window.checkoutInitialized = true;
        const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect } = React;
        const e = React.createElement; 
        
        const DEFAULT_CODIGO_PIX_COPIA_COLA = "00020101021226900014br.gov.bcb.pix2568pix.adyen.com/pixqrcodelocation/pixloc/v1/loc/hWu3o18RS3OOujzeqNF5iQ5204000053039865802BR5925MONETIZZE IMPULSIONADORA 6009SAO PAULO62070503***63047984";
        const DEFAULT_URL_IMAGEM_QRCODE = "/assets/img/qrcode.webp"; 
        
        const PRODUCT_INFO = { 
            name: "Fritadeira Elétrica Forno Oven 12L Mondial AFON-12L-BI", 
            originalPrice: 399.90, 
            price: 197.99, 
            image: "/assets/img/01.webp", 
            id: "AFON-12L-BI" 
        };

        const trackEvent = (event, data = {}) => { 
            if (window.trackPixel) window.trackPixel(event, data); 
        };

        const useInputMask = (type) => {
            const mask = useMemo(() => {
                try {
                    if (window.createInputMask) return window.createInputMask(type);
                } catch(e) {}
                return {
                    format: function(value, selectionStart){
                        var v = value || '';
                        var pos = (selectionStart === undefined || selectionStart === null) ? v.length : selectionStart;
                        return { formatted: v, cursorPosition: pos };
                    }
                };
            }, [type]);
            const inputRef = useRef(null);
            return { mask, inputRef };
        };

        const Icons = {
            Lock: ({className}) => e("svg", {className: className || "w-3 h-3", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("rect", {x: "3", y: "11", width: "18", height: "11", rx: "2", ry: "2"}), e("path", {d: "M7 11V7a5 5 0 0 1 10 0v4"})),
            Truck: ({className}) => e("svg", {className: className || "w-4 h-4 flex-shrink-0 text-yellow-700", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("rect", {x: "1", y: "3", width: "15", height: "13"}), e("polygon", {points: "16 8 20 8 23 11 23 16 16 16 16 8"}), e("circle", {cx: "5.5", cy: "18.5", r: "2.5"}), e("circle", {cx: "18.5", cy: "18.5", r: "2.5"})),
            User: ({className}) => e("svg", {className: className || "w-5 h-5 text-gray-400", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("path", {d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"}), e("circle", {cx: "12", cy: "7", r: "4"})),
            Mail: ({className}) => e("svg", {className: className || "w-5 h-5 text-gray-400", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("path", {d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"}), e("polyline", {points: "22,6 12,13 2,6"})),
            Phone: ({className}) => e("svg", {className: className || "w-5 h-5 text-gray-400", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("path", {d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"})),
            Shield: ({className}) => e("svg", {className: className || "w-5 h-5 text-gray-400", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("path", {d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"}), e("path", {d: "m9 12 2 2 4-4"})),
            Check: ({className}) => e("svg", {className: className || "w-4 h-4 text-white", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3", strokeLinecap: "round", strokeLinejoin: "round"}, e("polyline", {points: "20 6 9 17 4 12"})),
            Copy: ({className}) => e("svg", {className: className || "w-5 h-5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("rect", {x: "9", y: "9", width: "13", height: "13", rx: "2", ry: "2"}), e("path", {d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"})),
            Star: ({className}) => e("svg", {className: className || "w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("polygon", {points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"})),
            Package: ({className}) => e("svg", {className: className || "w-4 h-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round"}, e("line", {x1: "16.5", y1: "9.4", x2: "7.5", y2: "4.21"}), e("path", {d: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"}), e("polyline", {points: "3.27 6.96 12 12.01 20.73 6.96"}), e("line", {x1: "12", y1: "22.08", x2: "12", y2: "12"}))
        };

        function CheckoutScreen({ onSuccess }) {
            const [loading, setLoading] = useState(false);
            const [loadingCep, setLoadingCep] = useState(false);
            const [cepFailed, setCepFailed] = useState(false);
            const [formData, setFormData] = useState(() => { 
                try { 
                    const saved = localStorage.getItem('checkout_safe_data'); 
                    return saved ? JSON.parse(saved) : { name: '', email: '', phone: '', cpf: '', cep: '', address: '', number: '', city: '' }; 
                } catch(e) { 
                    return { name: '', email: '', phone: '', cpf: '', cep: '', address: '', number: '', city: '' }; 
                } 
            });
            
            const [timeLeft, setTimeLeft] = useState(15 * 60);
            const [submitAttempted, setSubmitAttempted] = useState(false);
            const [isFormLocked, setIsFormLocked] = useState(false);
            const [isSubmitting, setIsSubmitting] = useState(false);
            
            const cursorRef = useRef(null);
            const numberRef = useRef(null);
            const progressRef = useRef(null);
            const formRef = useRef(null);
            const hasTrackedStartRef = useRef(false);
            const submitButtonRef = useRef(null);
            const mobileSubmitButtonRef = useRef(null);
            
            const { mask: phoneMask, inputRef: phoneInputRef } = useInputMask('phone');
            const { mask: cpfMask, inputRef: cpfInputRef } = useInputMask('cpf');
            const { mask: cepMask, inputRef: cepInputRef } = useInputMask('cep');
            const fetchingCepRef = useRef(false);

            useEffect(() => { try { localStorage.setItem('checkout_safe_data', JSON.stringify(formData)); } catch(e){} }, [formData]);

            useLayoutEffect(() => {
                if (!cursorRef.current) return;
                const { ref, pos } = cursorRef.current;
                if (ref && ref.current) {
                    try {
                        requestAnimationFrame(() => {
                            if (document.activeElement === ref.current) {
                                ref.current.setSelectionRange(pos, pos);
                            }
                        });
                    } catch(e) {}
                }
                cursorRef.current = null;
            }); 

            useEffect(() => { 
                try { 
                    window.scrollTo(0, 0); 
                    trackEvent('ViewContent', { ...window.PRODUCT_CONTENT, event_id: window.generateEventId(), content_name: PRODUCT_INFO.name }); 
                } catch(e) {} 
                
                const icId = window.generateEventId ? window.generateEventId() : 'evt_'+Date.now(); 
                trackEvent('InitiateCheckout', { ...window.PRODUCT_CONTENT, content_name: PRODUCT_INFO.name, event_id: icId }); 
                
                const analyticsTimer = setTimeout(() => { if (window.loadAnalytics) window.loadAnalytics(); }, 3500);
                const timerInterval = setInterval(() => { setTimeLeft(prev => prev > 0 ? prev - 1 : 0); }, 1000);

                return () => { clearTimeout(analyticsTimer); clearInterval(timerInterval); }
            }, []);

            useEffect(() => { 
                const totalFields = 5; 
                const filledFields = Object.keys(formData).filter(key => ['name', 'email', 'phone', 'cpf', 'address', 'number'].includes(key) && formData[key]).length;
                const progress = Math.min((filledFields / totalFields) * 100, 100);
                if (progressRef.current) progressRef.current.style.width = `${progress}%`; 
            }, [formData]);

            const validationErrors = useMemo(() => {
                if (!submitAttempted) return {};
                const errors = {};
                if (!formData.name || !formData.name.trim()) errors.name = 'Nome obrigatório';
                if (!formData.email || !formData.email.trim()) errors.email = 'E-mail obrigatório';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'E-mail inválido';
                if (!formData.phone || !formData.phone.trim()) errors.phone = 'Telefone obrigatório';
                else if (formData.phone.replace(/\D/g, '').length < 10) errors.phone = 'Telefone inválido';
                return errors;
            }, [formData, submitAttempted]);

            // --- CORREÇÃO EMQ: Normalização E.164 e Hashing em Tempo Real ---
            const handleBlur = (field) => {
                if (!formData[field]) return;
                
                let valueToSend = formData[field];
                let isValid = false;

                if (field === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valueToSend)) {
                    isValid = true;
                }

                if (field === 'phone') {
                    let digits = valueToSend.replace(/\D/g, '');
                    if (digits.length >= 10) {
                        // Força formato E.164 (BR) exigido pelo TikTok
                        if (!digits.startsWith('55')) digits = '55' + digits;
                        valueToSend = digits;
                        isValid = true;
                    }
                }
                
                if (isValid) {
                    trackEvent('InputCaptured', { 
                        field_name: field, 
                        event_id: window.generateEventId(),
                        [field]: valueToSend 
                    });
                }
            };

            const trackStartTyping = () => { 
                if (!hasTrackedStartRef.current) { 
                    hasTrackedStartRef.current = true; 
                    trackEvent('ClickButton', { content_name: 'Iniciou Preenchimento', button_name: 'input_name' }); 
                } 
            };
            
            const getDeliveryDate = () => { 
                const d = new Date(); d.setDate(d.getDate() + 4);
                const day = d.getDate();
                const months = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
                const days = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
                return `${days[d.getDay()]}, ${day} de ${months[d.getMonth()]}`;
            };
            
            const handleCep = async (val) => { 
                if (fetchingCepRef.current) return;
                const cep = val.replace(/\D/g, ''); 
                if (cep.length === 8) { 
                    fetchingCepRef.current = true; setLoadingCep(true); 
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 5000); 

                    try { 
                        setCepFailed(false);
                        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: controller.signal }); 
                        clearTimeout(timeoutId);
                        if (!res.ok) throw new Error('ViaCEP HTTP ' + res.status);
                        const data = await res.json(); 
                        if(!data || data.erro) { 
                            setCepFailed(true);
                        } else { 
                            setFormData(prev => ({ ...prev, address: data.logradouro || '', city: `${data.localidade || ''}/${data.uf || ''}`.replace(/^\//,'') })); 
                            setTimeout(() => { try { if(numberRef.current) numberRef.current.focus(); } catch(e){} }, 300);
                        }
                    } catch(e) {
                        try { setCepFailed(true); } catch(_) {}
                    } finally {
                        setLoadingCep(false); fetchingCepRef.current = false;
                    }
                } 
            };
            
            const handleChange = (e) => { if (!isFormLocked && !isSubmitting) setFormData(prev => ({...prev, [e.target.name]: e.target.value})); };
            
            const handlePhoneChange = (e) => {
                if (isFormLocked || isSubmitting) return;
                const { name, value, selectionStart } = e.target;
                const result = phoneMask.format(value, selectionStart);
                setFormData(prev => ({...prev, [name]: result.formatted}));
                cursorRef.current = { ref: phoneInputRef, pos: result.cursorPosition };
            };
            
            const handleCpfChange = (e) => {
                if (isFormLocked || isSubmitting) return;
                const { name, value, selectionStart } = e.target;
                const result = cpfMask.format(value, selectionStart);
                setFormData(prev => ({...prev, [name]: result.formatted}));
                cursorRef.current = { ref: cpfInputRef, pos: result.cursorPosition };
            };
            
            const handleCepChange = (e) => {
                if (isFormLocked || isSubmitting) return;
                const { name, value, selectionStart } = e.target;
                const result = cepMask.format(value, selectionStart);
                setFormData(prev => ({...prev, [name]: result.formatted}));
                cursorRef.current = { ref: cepInputRef, pos: result.cursorPosition };
                if (value.replace(/\D/g, '').length < 8) { try { setCepFailed(false); } catch(e) {} }
                if (value.replace(/\D/g, '').length === 8 && formData.cep.replace(/\D/g, '') !== value.replace(/\D/g, '')) handleCep(value.replace(/\D/g, ''));
            };

            const handleSubmit = (ev) => {
                if(ev) ev.preventDefault();
                if (isSubmitting || isFormLocked || loading) return;
                
                setIsSubmitting(true);
                if (submitButtonRef.current) { submitButtonRef.current.disabled = true; submitButtonRef.current.setAttribute('aria-busy', 'true'); }
                if (mobileSubmitButtonRef.current) { mobileSubmitButtonRef.current.disabled = true; mobileSubmitButtonRef.current.setAttribute('aria-busy', 'true'); }
                
                setSubmitAttempted(true);
                const errors = {};
                if (!formData.name || !formData.name.trim()) errors.name = 'Nome obrigatório';
                if (!formData.email || !formData.email.trim()) errors.email = 'E-mail obrigatório';
                else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'E-mail inválido';
                if (!formData.phone || !formData.phone.trim()) errors.phone = 'Telefone obrigatório';
                else if (formData.phone.replace(/\D/g, '').length < 10) errors.phone = 'Telefone inválido';
                
                if (Object.keys(errors).length > 0) {
                    const firstError = Object.keys(errors)[0];
                    trackEvent('Checkout_Error', { error_field: firstError, error_message: errors[firstError], event_id: window.generateEventId() });

                    const errorElement = document.querySelector(`[name="${firstError}"]`);
                    if (errorElement) {
                        requestAnimationFrame(() => { 
                            const header = document.querySelector('.static-nav');
                            const offset = header ? header.clientHeight + 60 : 120;
                            const y = errorElement.getBoundingClientRect().top + window.scrollY - offset;
                            window.scrollTo({top: Math.max(0, y), behavior: 'smooth'});
                            errorElement.focus({preventScroll: true}); 
                        });
                    }
                    setTimeout(() => {
                        setIsSubmitting(false);
                        if (submitButtonRef.current) { submitButtonRef.current.disabled = false; submitButtonRef.current.removeAttribute('aria-busy'); }
                        if (mobileSubmitButtonRef.current) { mobileSubmitButtonRef.current.disabled = false; mobileSubmitButtonRef.current.removeAttribute('aria-busy'); }
                    }, 500);
                    return;
                }
                
                if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                setIsFormLocked(true); setLoading(true);
                
                const finalEmail = formData.email.toLowerCase().trim();
                let finalPhone = formData.phone.replace(/\D/g, ''); 
                if (finalPhone.length >= 10 && !finalPhone.startsWith('55')) finalPhone = '55' + finalPhone;

                const nameParts = formData.name.trim().split(" ");
                const firstName = nameParts[0];
                const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";
                
                let city = "", state = "";
                if(formData.city) {
                    if(formData.city.includes('/')) {
                        const parts = formData.city.split('/');
                        city = parts[0].trim();
                        state = parts[1].trim();
                    } else { city = formData.city; }
                }
                const uniqueOrderId = 'ord_' + new Date().getTime(); 
                
                // --- CORREÇÃO EMQ: AddPaymentInfo agora com e-mail e telefone ---
                trackEvent('AddPaymentInfo', { 
                    ...window.PRODUCT_CONTENT, 
                    event_id: window.generateEventId(), 
                    order_id: uniqueOrderId,
                    email: finalEmail,
                    phone: finalPhone 
                });
                
                setTimeout(() => { 
                    onSuccess({ ...formData, email: finalEmail, phone: finalPhone, firstName, lastName, city, state, transactionId: uniqueOrderId }); 
                }, 800);
            };

            const shouldShowAddressFields = useMemo(() => {
                const cd = (formData.cep || '').replace(/\D/g, '');
                return !!formData.address || !!cepFailed || cd.length === 8;
            }, [formData.address, formData.cep, cepFailed]);
            
            return e("div", { className: "fade-in w-full min-h-screen font-sans bg-[#f8fafc] form-container" },
                e("div", { ref: progressRef, className: "progress-bar", style: {width: '10%'} }),
                e("div", { className: "static-nav bg-white/98 border-b border-gray-200 px-4 flex justify-between items-center z-30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" },
                    e("button", { type: "button", onClick: () => {
                        if (isFormLocked || isSubmitting) return;
                        try {
                            const ref = document.referrer || '';
                            const sameOrigin = ref && ref.indexOf(window.location.origin) === 0;
                            if (window.history.length > 1 && sameOrigin) window.history.back();
                            else window.location.href = '/';
                        } catch(e) { window.location.href = '/'; }
                    }, className: `flex items-center text-slate-400 hover:text-slate-600 transition-colors p-3 -ml-3 btn-tactile ${isFormLocked ? 'opacity-50 cursor-not-allowed' : ''}`, "aria-label": "Voltar", disabled: isFormLocked || isSubmitting }, 
                        e("svg", { className: "w-6 h-6", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2" }, e("polyline", {points: "15 18 9 12 15 6"}))
                    ),
                    e("img", { src: "assets/img/logo.webp", alt: "Logo", className: "h-8 w-auto object-contain" }),
                    e("div", {className: "w-12"})
                ),
                e("div", { className: "max-w-[500px] lg:max-w-5xl mx-auto p-4 lg:px-8 pt-6 lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start" },
                    e("div", { className: "space-y-4 lg:col-span-5 lg:sticky lg:top-28" },
                        e("div", { className: "bg-white rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] p-5 flex gap-4 border border-slate-100 relative group" },
                            e("div", { className: "absolute top-0 left-0 bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-br-lg" }, "OFERTA TIKTOK"),
                            e("div", { className: "w-24 h-24 bg-white rounded-xl overflow-hidden flex-shrink-0 border border-slate-100 p-2 shadow-inner" }, e("img", { src: PRODUCT_INFO.image, className: "w-full h-full object-contain" })),
                            e("div", {className: "flex-1 min-w-0 mt-2"},
                                e("h3", { className: "text-sm font-bold text-slate-800 leading-snug line-clamp-2 mb-1" }, PRODUCT_INFO.name),
                                e("div", {className: "flex flex-col items-start"}, e("span", { className: "text-xs text-slate-400 line-through" }, "De R$ " + PRODUCT_INFO.originalPrice.toFixed(2).replace('.',',')), e("span", { className: "font-extrabold text-2xl text-green-600 tracking-tight" }, "Por R$ " + PRODUCT_INFO.price.toFixed(2).replace('.',',')))
                            )
                        )
                    ),
                    e("form", { id: "checkout-form", ref: formRef, onSubmit: handleSubmit, className: "space-y-4 lg:col-span-7", noValidate: true },
                        e("div", { className: "bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden" },
                            e("div", { className: "bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center gap-3" }, e("span", { className: "bg-green-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md" }, "1"), e("h3", { className: "text-sm font-bold text-slate-700 uppercase" }, "Dados Pessoais")),
                            e("div", {className: "p-5 pt-6"},
                                e("div", {className: "mb-4"},
                                    e("label", { className: "text-[11px] font-bold text-slate-500 uppercase mb-1.5 block" }, "Nome Completo"),
                                    e("input", { type: "text", name: "name", value: formData.name, onChange: handleChange, onFocus: trackStartTyping, className: `w-full py-3.5 px-4 bg-white border ${validationErrors.name ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} rounded-xl text-slate-700`, placeholder: "Digite seu nome completo", required: true, disabled: isFormLocked || isSubmitting })
                                ),
                                e("div", {className: "mb-4"},
                                    e("label", { className: "text-[11px] font-bold text-slate-500 uppercase mb-1.5 block" }, "E-mail"),
                                    e("input", { type: "email", name: "email", value: formData.email, onChange: handleChange, onBlur: () => handleBlur('email'), className: `w-full py-3.5 px-4 bg-white border ${validationErrors.email ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} rounded-xl text-slate-700`, placeholder: "exemplo@email.com", required: true, inputMode: "email", disabled: isFormLocked || isSubmitting })
                                ),
                                e("div", {className: "mb-4"},
                                    e("label", { className: "text-[11px] font-bold text-slate-500 uppercase mb-1.5 block" }, "Celular (WhatsApp)"),
                                    e("input", { ref: phoneInputRef, type: "tel", name: "phone", value: formData.phone, onChange: handlePhoneChange, onBlur: () => handleBlur('phone'), className: `w-full py-3.5 px-4 bg-white border ${validationErrors.phone ? 'border-red-500 bg-red-50/30' : 'border-slate-200'} rounded-xl text-slate-700`, placeholder: "(00) 00000-0000", required: true, inputMode: "tel", disabled: isFormLocked || isSubmitting })
                                )
                            )
                        ),
                        e("div", { className: "bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden" },
                            e("div", { className: "bg-slate-50/50 px-5 py-3 border-b border-slate-100 flex items-center gap-3" }, e("span", { className: "bg-green-600 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md" }, "2"), e("h3", { className: "text-sm font-bold text-slate-700 uppercase" }, "Entrega")),
                            e("div", {className: "p-5 pt-6 space-y-4"},
                                e("div", {className: "relative"},
                                    e("label", { className: "text-[11px] font-bold text-slate-500 uppercase mb-1.5 block" }, "CEP"),
                                    e("input", { ref: cepInputRef, type: "text", name: "cep", value: formData.cep, onChange: handleCepChange, className: "w-full py-3.5 px-4 border border-slate-200 rounded-xl", placeholder: "00000-000", inputMode: "numeric", disabled: isFormLocked || isSubmitting })
                                ),
                                shouldShowAddressFields && e("div", { className: "grid grid-cols-4 gap-3 animate-fade-in" },
                                    e("div", {className: "col-span-4"}, e("input", { name: "address", value: formData.address, onChange: handleChange, className: "w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm", placeholder: "Rua, Avenida...", disabled: isFormLocked || isSubmitting })),
                                    e("div", {className: "col-span-1"}, e("input", { ref: numberRef, name: "number", value: formData.number, onChange: handleChange, placeholder: "123", className: "w-full p-3.5 border border-green-300 rounded-xl font-bold text-center", inputMode: "numeric", disabled: isFormLocked || isSubmitting })),
                                    e("div", {className: "col-span-3"}, e("input", { name: "city", value: formData.city, onChange: handleChange, className: "w-full p-3.5 bg-white border border-slate-200 rounded-xl text-sm", placeholder: "Cidade/UF", disabled: isFormLocked || isSubmitting }))
                                )
                            )
                        ),
                        e("div", { className: "hidden lg:block bg-white rounded-2xl shadow-[0_2px_15px_rgb(0,0,0,0.03)] border border-slate-100 overflow-hidden" },
                            e("div", {className: "p-5"},
                                e("button", { ref: submitButtonRef, disabled: loading || isFormLocked || isSubmitting, type: "submit", className: `w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 rounded-xl text-lg flex justify-center items-center gap-2 shadow-xl ${loading || isFormLocked || isSubmitting ? 'opacity-80 grayscale' : 'hover:-translate-y-0.5'} btn-tactile min-h-[56px]`, "aria-busy": loading }, 
                                    loading ? e("span", {className: "flex items-center gap-2"}, e("div", { className: "spinner-mobile" }), "Processando...") : e("span", {className: "flex items-center gap-2"}, "FINALIZAR COM DESCONTO", e("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3" }, e("polyline", {points: "9 18 15 12 9 6"})))
                                )
                            )
                        )
                    ),
                ),
                e("div", {className: "lg:hidden checkout-fixed-footer"},
                    e("button", { ref: mobileSubmitButtonRef, onClick: (e) => { handleSubmit(e); }, disabled: loading || isFormLocked || isSubmitting, type: "button", className: `w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-bold py-4 rounded-xl text-lg flex justify-center items-center gap-2 shadow-xl ${loading || isFormLocked || isSubmitting ? 'opacity-80 grayscale' : ''} btn-tactile min-h-[56px]`, "aria-busy": loading }, 
                        loading ? e("span", {className: "flex items-center gap-2"}, e("div", { className: "spinner-mobile" }), "Processando...") : e("span", {className: "flex items-center gap-2"}, "FINALIZAR COM DESCONTO", e("svg", { className: "w-5 h-5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "3" }, e("polyline", {points: "9 18 15 12 9 6"})))
                    )
                )
            );
        }

        function PixScreen({ customerData, pixCode, qrCodeUrl }) {
            const [loadingState, setLoadingState] = useState(0); 
            const [copied, setCopied] = useState(false);
            const [keyboardClosed, setKeyboardClosed] = useState(false);
            
            const activeData = customerData || {};
            const firstName = activeData.firstName || 'Cliente';
            const transactionId = activeData.transactionId || 'ERR_NO_ID';

            const effectivePixCode = (pixCode && String(pixCode).trim()) ? String(pixCode).trim() : DEFAULT_CODIGO_PIX_COPIA_COLA;
            let effectiveQrUrl = (typeof qrCodeUrl === 'string' && qrCodeUrl.trim()) ? qrCodeUrl.trim() : DEFAULT_URL_IMAGEM_QRCODE;

            useEffect(() => {
                if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
                requestAnimationFrame(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); });
                
                // --- CORREÇÃO EMQ: CompletePayment agora com e-mail e telefone normalizados ---
                if (customerData && customerData.transactionId) {
                    trackEvent('CompletePayment', { 
                        ...window.PRODUCT_CONTENT, 
                        content_name: 'Fritadeira Elétrica Forno Oven 12L Mondial AFON-12L-BI', 
                        value: 197.99, 
                        currency: 'BRL', 
                        order_id: customerData.transactionId, 
                        event_id: window.generateEventId(), 
                        email: customerData.email, 
                        phone: customerData.phone 
                    });
                }
                
                const step1 = setTimeout(() => setLoadingState(1), 500);
                const step2 = setTimeout(() => setLoadingState(2), 1200); 
                const step3 = setTimeout(() => { setLoadingState(3); setKeyboardClosed(true); }, 2000); 
                
                return () => { clearTimeout(step1); clearTimeout(step2); clearTimeout(step3); };
            }, [transactionId]);

            const copyPix = async () => { 
                trackEvent('Pix_Copy_Click', { event_id: window.generateEventId(), order_id: transactionId });
                try { 
                    await window.safeCopyToClipboard(effectivePixCode);
                    setCopied(true);
                } catch (err) { setCopied(true); }
                setTimeout(() => setCopied(false), 2000); 
            };

            if (loadingState < 3) return e("div", { className: "min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center" }, 
                e("div", { className: "w-20 h-20 border-[6px] border-slate-200 border-t-green-500 rounded-full animate-spin mb-8" }), 
                e("h2", { className: "text-2xl font-bold text-slate-800" }, "Finalizando sua compra...")
            );
            
            return e("div", { className: "min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4 font-sans py-10" },
                e("div", { className: `bg-white w-full max-w-[480px] lg:max-w-5xl rounded-2xl shadow-xl p-6 lg:p-10 border border-slate-100 transition-all ${keyboardClosed ? 'opacity-100' : 'opacity-0'}` },
                    e("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12" },
                        e("div", {className: "lg:col-span-6"},
                            e("h1", { className: "text-2xl font-black text-slate-800 mb-2" }, "Quase lá, " + firstName + "!"),
                            e("div", { className: "bg-green-50 border border-green-100 text-green-700 font-bold text-xs py-3 rounded-lg text-center mb-6 uppercase tracking-wide" }, "Pedido Reservado com Sucesso")
                        ),
                        e("div", {className: "lg:col-span-6"},
                            e("div", { className: "relative bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 p-4" }, 
                                e("button", { onClick: copyPix, className: `w-full py-4 rounded-xl font-bold text-white transition-all transform active:scale-[0.98] min-h-[52px] ${copied ? 'bg-slate-800' : 'bg-[#22c55e]'} btn-tactile` }, copied ? "CÓDIGO COPIADO!" : "CLIQUE PARA COPIAR")
                            ),
                            e("p", {className: "text-[10px] text-slate-400 text-center mt-6"}, "ID: " + transactionId)
                        )
                    )
                )
            );
        }

        function App() {
            const [screen, setScreen] = useState('checkout');
            const [customerData, setCustomerData] = useState(null);
            const [pixConfig, setPixConfig] = useState({ pixCode: DEFAULT_CODIGO_PIX_COPIA_COLA, qrCodeUrl: DEFAULT_URL_IMAGEM_QRCODE });
            
            useEffect(() => {
                const skeleton = document.getElementById('skeleton-loader');
                if (skeleton) {
                    setTimeout(() => {
                        skeleton.style.transition = 'opacity 0.3s ease-out';
                        skeleton.style.opacity = '0';
                        setTimeout(() => { skeleton.style.display = 'none'; }, 300);
                    }, 100);
                }
            }, []);

            useEffect(() => {
                (async () => {
                    try {
                        const res = await fetch(`/api/pix-config?_=${Date.now()}`, { cache: 'no-store' });
                        if (!res || !res.ok) return;
                        const cfg = await res.json();
                        if (cfg.pix_code) setPixConfig(prev => ({ ...prev, pixCode: cfg.pix_code }));
                    } catch (e) {}
                })();
            }, []);

            return screen === 'checkout' ? e(CheckoutScreen, { onSuccess: (data) => { setCustomerData(data); setScreen('pix'); } }) : e(PixScreen, { customerData: customerData, pixCode: pixConfig.pixCode, qrCodeUrl: pixConfig.qrCodeUrl });
        }
        
        const rootElement = document.getElementById('checkout-root');
        if (rootElement && !window.checkoutMounted) {
            window.checkoutMounted = true;
            if (ReactDOM.createRoot) ReactDOM.createRoot(rootElement).render(e(App));
            else if (ReactDOM.render) ReactDOM.render(e(App), rootElement);
        }
    };
    
    document.addEventListener('DOMContentLoaded', function() { if(window.initReactCheckout) window.initReactCheckout(); });