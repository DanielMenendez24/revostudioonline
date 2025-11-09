// Central JS for site: menu toggle, slider, filters, contact form handler
(function () {
  // Menu toggle (exposed globally for inline onclick attributes)
  window.toggleMenu = function () {
    const nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('active');
    const toggle = document.querySelector('.menu-toggle');
    if (toggle) toggle.classList.toggle('active');
  };

  // Slider: autoplay, pause on hover, indicators
  function initSlider() {
    let currentIndex = 0;
    const slider = document.getElementById('slider');
    if (!slider) return;
    const slides = Array.from(slider.children);
    const totalSlides = slides.length;
    const dotsContainer = document.getElementById('slider-dots');
    const sliderContainer = document.querySelector('.slider-container');

    function createDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      slides.forEach((_, i) => {
        const btn = document.createElement('button');
        btn.className = 'dot';
        btn.setAttribute('aria-label', `Ir a la diapositiva ${i + 1}`);
        btn.addEventListener('click', () => {
          goToSlide(i);
          restartAutoSlide();
        });
        dotsContainer.appendChild(btn);
      });
    }

    function updateDots() {
      if (!dotsContainer) return;
      Array.from(dotsContainer.children).forEach((d, i) => {
        d.classList.toggle('active', i === currentIndex);
      });
    }

    function showSlide(index) {
      slider.style.transform = `translateX(-${index * 100}%)`;
      slides.forEach((s, i) => s.setAttribute('aria-hidden', i === index ? 'false' : 'true'));
      updateDots();
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % totalSlides;
      showSlide(currentIndex);
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      showSlide(currentIndex);
    }

    function goToSlide(i) {
      currentIndex = ((i % totalSlides) + totalSlides) % totalSlides;
      showSlide(currentIndex);
    }

    const AUTO_DELAY = 5000; // ms
    let autoTimer = null;

    function startAutoSlide() {
      stopAutoSlide();
      autoTimer = setInterval(nextSlide, AUTO_DELAY);
    }

    function stopAutoSlide() {
      if (autoTimer) { clearInterval(autoTimer); autoTimer = null; }
    }

    function restartAutoSlide() { stopAutoSlide(); startAutoSlide(); }

    // expose prev/next globally (buttons in HTML use these names)
    window.nextSlide = function () { nextSlide(); restartAutoSlide(); };
    window.prevSlide = function () { prevSlide(); restartAutoSlide(); };

    createDots();
    showSlide(0);
    startAutoSlide();

    if (sliderContainer) {
      sliderContainer.addEventListener('mouseenter', stopAutoSlide);
      sliderContainer.addEventListener('mouseleave', startAutoSlide);
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { window.nextSlide(); }
      if (e.key === 'ArrowLeft') { window.prevSlide(); }
    });
  }

  // Filters (catalog)
  window.filtrarItems = function () {
    const checkboxes = document.querySelectorAll('.filtro input[type="checkbox"]');
    const items = document.querySelectorAll('.item');

    const categoriasSeleccionadas = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    items.forEach(item => {
      const categoria = item.getAttribute('data-categoria');
      if (categoriasSeleccionadas.length === 0 || categoriasSeleccionadas.includes(categoria)) {
        item.style.display = 'block';
      } else {
        item.style.display = 'none';
      }
    });
  };

  window.limpiarFiltros = function () {
    const checkboxes = document.querySelectorAll('.filtro input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    window.filtrarItems();
  };

  window.toggleFiltro = function () {
    const menu = document.getElementById('filtro-opciones');
    if (!menu) return;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
  };

  // Contact form handler with Formspree
  window.handleSubmit = function (e) {
    e.preventDefault();
    const form = document.getElementById('contactForm');
    const btn = document.querySelector('.btn-primary');
    if (!form || !btn) return false;

    // Get form values
    const name = form.querySelector('#name').value;
    const email = form.querySelector('#email').value;
    const phone = form.querySelector('#phone').value;
    const message = form.querySelector('#message').value;

    // Update reply-to field
    const replyToField = form.querySelector('input[name="_replyto"]');
    if (replyToField) replyToField.value = email;

    // Update button state
    const originalText = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    // Get form action URL
    const formAction = form.getAttribute('action');

    // Check if Formspree is configured (not using placeholder)
    if (formAction && formAction.includes('YOUR_FORM_ID')) {
      // Formspree not configured, use mailto fallback
      const subject = encodeURIComponent(`Contacto desde REVO Studio - ${name}`);
      const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\nTeléfono: ${phone || 'No proporcionado'}\n\nMensaje:\n${message}`);
      window.location.href = `mailto:daniel.menendez.contacto@gmail.com?subject=${subject}&body=${body}`;

      btn.textContent = 'Mensaje enviado';
      btn.disabled = false;
      form.reset();
      setTimeout(() => btn.textContent = originalText, 2500);
      return false;
    }

    // Use Formspree to send email
    const formData = new FormData(form);

    fetch(formAction, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    })
      .then(response => {
        if (response.ok) {
          btn.textContent = 'Mensaje enviado ✓';
          btn.disabled = false;
          form.reset();
          setTimeout(() => btn.textContent = originalText, 3000);
        } else {
          throw new Error('Error en la respuesta del servidor');
        }
      })
      .catch(error => {
        console.error('Error enviando formulario:', error);
        btn.textContent = 'Error al enviar';
        btn.disabled = false;
        setTimeout(() => {
          btn.textContent = originalText;
          // Fallback a mailto si falla
          const subject = encodeURIComponent(`Contacto desde REVO Studio - ${name}`);
          const body = encodeURIComponent(`Nombre: ${name}\nEmail: ${email}\nTeléfono: ${phone || 'No proporcionado'}\n\nMensaje:\n${message}`);
          if (confirm('Hubo un error al enviar el formulario. ¿Deseas abrir tu cliente de correo para enviar el mensaje manualmente?')) {
            window.location.href = `mailto:daniel.menendez.contacto@gmail.com?subject=${subject}&body=${body}`;
          }
        }, 2000);
      });

    return false;
  };

  // Initialize components on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', function () {
    initSlider();
    initCatalogAddButtons();
    renderCartPage();
    updateCartCounter();
  });

  /* ----------------- Cart functionality ----------------- */
  const CART_KEY = 'revo_cart_v1';

  function getCart() {
    try {
      const raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }

  function formatPrice(price) {
    return Number(price).toFixed(2);
  }

  function addToCart(item) {
    const cart = getCart();
    // try to find by id
    const existing = cart.find(c => c.id === item.id);
    if (existing) { existing.qty += item.qty || 1; }
    else { cart.push({ ...item, qty: item.qty || 1 }); }
    saveCart(cart);
    // quick UI feedback
    if (item._button) {
      const btn = item._button;
      const prev = btn.textContent;
      btn.textContent = 'Añadido';
      btn.disabled = true;
      setTimeout(() => { btn.textContent = prev; btn.disabled = false; }, 900);
    }
    // update cart display if on cart page
    renderCartPage();
    updateCartCounter();
  }

  function removeFromCart(id) {
    let cart = getCart();
    cart = cart.filter(i => i.id !== id);
    saveCart(cart);
    renderCartPage();
    updateCartCounter();
  }

  function updateQty(id, qty) {
    const cart = getCart();
    const it = cart.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(1, Number(qty) || 1);
    saveCart(cart);
    renderCartPage();
    updateCartCounter();
  }

  // Update cart counter badge
  function updateCartCounter() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    const cartIcon = document.querySelector('.cart-icon');
    if (!cartIcon) return;

    let counter = cartIcon.querySelector('.cart-counter');

    if (totalItems > 0) {
      if (!counter) {
        counter = document.createElement('span');
        counter.className = 'cart-counter';
        cartIcon.appendChild(counter);
      }
      counter.textContent = totalItems > 99 ? '99+' : totalItems;
      counter.classList.remove('hidden');
    } else {
      if (counter) {
        counter.classList.add('hidden');
      }
    }
  }

  // Dynamically load a script by URL
  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[src="${url}"]`);
      if (existing) {
        existing.addEventListener('load', () => resolve());
        if (existing.readyState === 'complete') resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Error loading ' + url));
      document.head.appendChild(s);
    });
  }

  // Generate a simple invoice PDF using jsPDF (loaded dynamically)
  async function generateInvoicePDF(cart, total) {
    // try to load jsPDF UMD build from CDN
    const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    if (!window.jspdf) {
      await loadScript(CDN);
    }
    const { jsPDF } = window.jspdf || window.jspPDF || {};
    if (!jsPDF) throw new Error('jsPDF not available');

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const margin = 40;
    let y = margin;

    // Company info (upper-left)
    const company = {
      name: 'REVO Studio SAS BIC',
      rut: '214296019001',
      address: 'Pedro Margat 1606',
      phone: '099309557',
      email: 'revostudio@gmail.com'
    };

    const date = new Date();
    const invoiceId = 'INV-' + date.getFullYear() + ('' + (date.getMonth() + 1)).padStart(2, '0') + ('' + date.getDate()).padStart(2, '0') + '-' + Math.floor(Math.random() * 9000 + 1000);

    // Title + Header: show "Factura" above company data (upper-left)
    doc.setFontSize(26);
    doc.text('Factura', margin, y);
    y += 30;

    // Helper to load image to dataURL (used for logo). Placed here so we can measure and layout before drawing text.
    async function loadImageSync(url) {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve({ dataURL: canvas.toDataURL('image/png'), width: img.width, height: img.height });
          } catch (err) { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }

    // Prepare company text measurements (without drawing) to compute logo size and layout
    const companyNameLines = doc.splitTextToSize(company.name, 260);
    const nameHeight = companyNameLines.length * 14; // approx line height for fontSize 11
    const otherLines = [`R.U.T.: ${company.rut}`, `Dirección: ${company.address}`, `Tel: ${company.phone}`, `Email: ${company.email}`];
    const otherHeight = otherLines.length * 12; // approx for fontSize 10
    const companyHeight = nameHeight + otherHeight;

    // load logo (same-origin) to compute aspect and dimensions
    const logoPath = './img/logo/REVO_final_2.0.png';
    let logoInfo = null;
    try { logoInfo = await loadImageSync(logoPath); } catch (e) { logoInfo = null; }

    let logoW = 0, logoH = 0;
    if (logoInfo) {
      logoH = companyHeight;
      const aspect = logoInfo.width / (logoInfo.height || 1);
      logoW = logoH * aspect;
      const maxLogoW = 160; // cap to avoid pushing content too far
      if (logoW > maxLogoW) { logoW = maxLogoW; logoH = logoW / aspect; }
    }

    // decide X position for company text depending on logo
    const companyX = logoW > 0 ? margin + logoW + 12 : margin;

    // Header: left = company (draw logo left if present), right = invoice number + date
    // draw logo if available
    const companyStartY = y;
    if (logoInfo && logoInfo.dataURL) {
      // draw logo at margin, aligned to companyStartY
      doc.addImage(logoInfo.dataURL, 'PNG', margin, companyStartY, logoW, logoH);
    }

    // draw company text at companyX
    doc.setFontSize(11);
    doc.text(companyNameLines, companyX, y);
    y += nameHeight;
    doc.setFontSize(10);
    otherLines.forEach(line => { doc.text(line, companyX, y); y += 12; });

    // Right side: invoice number + date/time (moved más abajo)
    const rightX = 420;
    const rightY = margin + 60; // bajar número/fecha
    doc.setFontSize(11);
    doc.text(`Factura Nº: ${invoiceId}`, rightX, rightY);
    doc.setFontSize(10);
    doc.text(`Fecha: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`, rightX, rightY + 18);

    // Move down before table (aumentar espacio superior para separar header del cuerpo)
    // Incrementamos el offset para dejar más aire antes de la tabla principal
    y = Math.max(y, margin + 120);
    y += 20;

    // Table header (sin columna de subtotal en el cuerpo)
    doc.setFontSize(11);
    doc.text('Descripción', margin, y);
    doc.text('Precio unitario', margin + 300, y);
    doc.text('Cantidad', margin + 415, y);
    y += 8;
    doc.setLineWidth(0.5);
    doc.line(margin, y, 560, y);
    y += 12;

    let subtotalSum = 0;
    cart.forEach(item => {
      const name = item.name || '';
      const price = Number(item.price || 0);
      const qty = Number(item.qty || 1);
      const subtotal = price * qty;
      subtotalSum += subtotal;

      // wrap description
      const maxWidth = 260;
      const lines = doc.splitTextToSize(name, maxWidth);
      doc.text(lines, margin, y);
      // numeric columns: precio y cantidad (sin subtotal por fila)
      doc.text(`$${formatPrice(price)}`, margin + 300, y);
      doc.text(`${qty}`, margin + 420, y);
      y += (lines.length * 14) + 8;
      if (y > 720) { doc.addPage(); y = margin; }
    });

    // IVA and Total
    const IVA_RATE = 0.22;
    const ivaAmount = subtotalSum * IVA_RATE;
    const grandTotal = subtotalSum + ivaAmount;

    // separator
    doc.setLineWidth(0.5);
    if (y + 60 > 780) { doc.addPage(); y = margin; }
    doc.line(margin, y, 560, y);
    y += 14;
    // Mostrar subtotal, IVA y total alineados al margen derecho
    const pageW = doc.internal.pageSize.getWidth();
    const rightEdge = pageW - margin; // x del margen derecho
    const amountRightX = rightEdge; // montos alineados a la derecha del margen
    const labelRightX = amountRightX - 140; // etiquetas colocadas a la izquierda de los montos
    doc.setFontSize(12);
    doc.text('Subtotal:', labelRightX, y, { align: 'right' });
    doc.text(`$${formatPrice(subtotalSum)}`, amountRightX, y, { align: 'right' });
    y += 16;
    doc.text('IVA:', labelRightX, y, { align: 'right' });
    doc.text(`$${formatPrice(ivaAmount)}`, amountRightX, y, { align: 'right' });
    y += 16;
    doc.setFontSize(13);
    doc.text('Total:', labelRightX, y, { align: 'right' });
    doc.text(`$${formatPrice(grandTotal)}`, amountRightX, y, { align: 'right' });

    // Footer / QR: create a digital version as a small HTML and encode as data URL
    y += 28;
    const digitalHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Factura ${invoiceId}</title></head><body><h1>Factura ${invoiceId}</h1><p><strong>Empresa:</strong> ${company.name}<br><strong>RUT:</strong> ${company.rut}<br><strong>Dirección:</strong> ${company.address}<br><strong>Tel:</strong> ${company.phone}<br><strong>Email:</strong> ${company.email}</p><hr><h2>Detalles</h2><table border="1" cellpadding="6" cellspacing="0"><thead><tr><th>Descripción</th><th>Precio</th><th>Cantidad</th><th>Subtotal</th></tr></thead><tbody>${cart.map(it => `<tr><td>${it.name}</td><td>$${formatPrice(it.price)}</td><td>${it.qty}</td><td>$${formatPrice(it.price * it.qty)}</td></tr>`).join('')}</tbody></table><p><strong>Subtotal:</strong> $${formatPrice(subtotalSum)}<br><strong>IVA (22%):</strong> $${formatPrice(ivaAmount)}<br><strong>Total:</strong> $${formatPrice(grandTotal)}</p></body></html>`;

    // Helper to base64-encode utf8
    function base64EncodeUnicode(str) {
      return btoa(unescape(encodeURIComponent(str)));
    }

    const dataUrl = 'data:text/html;base64,' + base64EncodeUnicode(digitalHtml);

    // Generate QR image via Google Chart API (encodes the data URL)
    const qrApi = 'https://chart.googleapis.com/chart?cht=qr&chs=200x200&chld=L|1&chl=' + encodeURIComponent(dataUrl);

    // helper to load an image and convert to dataURL via canvas
    // returns { dataURL, width, height } and accepts optional alpha (opacity)
    async function loadImageToDataURL(url, alpha = 1) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (alpha < 1) ctx.globalAlpha = alpha;
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/png');
            resolve({ dataURL, width: img.width, height: img.height });
          } catch (err) { resolve(null); }
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    }

    try {
      // Primero intentamos la API de Google Charts (puede fallar por CORS)
      let qrDataUrl = null;
      try {
        const qrInfo = await loadImageToDataURL(qrApi);
        if (qrInfo && qrInfo.dataURL) qrDataUrl = qrInfo.dataURL;
      } catch (e) {
        qrDataUrl = null;
      }

      // Si la llamada anterior no produjo dataURL, generar QR localmente con QRious
      if (!qrDataUrl) {
        try {
          // cargar QRious desde CDN
          await loadScript('https://cdn.jsdelivr.net/npm/qrious@4.0.2/dist/qrious.min.js');
          if (window.QRious) {
            const qr = new window.QRious({ value: dataUrl, size: 200 });
            qrDataUrl = qr.toDataURL();
          }
        } catch (e) {
          console.warn('QRious load/generate failed', e);
          qrDataUrl = null;
        }
      }

      if (qrDataUrl) {
        // colocar QR en la esquina inferior izquierda, con ancho = 20% del área imprimible
        const pageW = doc.internal.pageSize.getWidth();
        const pageH = doc.internal.pageSize.getHeight();
        const availableW = pageW - margin * 2;
        const qrSize = availableW * 0.40; // 40% del ancho imprimible (más grande)
        const qrX = margin;
        const qrY = pageH - margin - qrSize; // esquina inferior izquierda
        doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      }
    } catch (err) {
      // ignore QR errors
      console.warn('QR generation failed', err);
    }

    // Add logo as watermark below the body: centered, 50% of page width, low opacity
    try {
      const logoPath = './img/logo/REVO_final_2.0.png';
      const logoInfo = await loadImageToDataURL(logoPath, 0.12);
      if (logoInfo && logoInfo.dataURL) {
        const pageW = doc.internal.pageSize.getWidth();
        const availableW = pageW - margin * 2;
        const logoW = availableW * 0.5; // 50% of pdf width
        const aspect = logoInfo.width / logoInfo.height || 1;
        const logoH = logoW / aspect;
        if (y + logoH > 780) { doc.addPage(); y = margin; }
        const x = (pageW - logoW) / 2;
        doc.addImage(logoInfo.dataURL, 'PNG', x, y, logoW, logoH);
        y += logoH + 10;
      }
    } catch (err) {
      console.warn('Logo watermark failed', err);
    }

    // Barcode (bottom-right): generate CODE128 barcode from invoiceId
    try {
      async function generateBarcodeDataURL(text, width, height) {
        // load JsBarcode if needed
        await loadScript('https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js');
        if (!window.JsBarcode && !window.JSBarcode) throw new Error('JsBarcode not available');
        // create a canvas and render barcode
        const canvas = document.createElement('canvas');
        // set an initial size; JsBarcode will scale
        canvas.width = Math.max(200, Math.floor(width));
        canvas.height = Math.max(60, Math.floor(height));
        try {
          window.JsBarcode(canvas, text, {
            format: 'CODE128',
            displayValue: true,
            height: canvas.height * 0.7,
            margin: 0,
            background: '#ffffff',
            textMargin: 4,
          });
          return canvas.toDataURL('image/png');
        } catch (err) {
          console.warn('JsBarcode render error', err);
          return null;
        }
      }

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const printableW = pageW - margin * 2;
      const barcodeW = printableW * 0.3; // 30% del ancho imprimible
      const barcodeH = 60; // altura en pts
      const barcodeDataUrl = await generateBarcodeDataURL(invoiceId, barcodeW, barcodeH);
      if (barcodeDataUrl) {
        const bx = pageW - margin - barcodeW;
        const by = pageH - margin - barcodeH; // bottom-right corner
        doc.addImage(barcodeDataUrl, 'PNG', bx, by, barcodeW, barcodeH);
      }
    } catch (err) {
      console.warn('Barcode generation failed', err);
    }

    const filename = `${invoiceId}.pdf`;
    doc.save(filename);
  }

  // Build a simple id from name
  function makeId(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  // Initialize add-to-cart counter controls for items in the catalog
  function initCatalogAddButtons() {
    const items = document.querySelectorAll('.item');
    items.forEach(itemEl => {
      // avoid duplicate counters
      if (itemEl.querySelector('.cart-counter-controls')) return;
      const nameEl = itemEl.querySelector('.item-info h3');
      const priceEl = itemEl.querySelector('.item-info p');
      const imgEl = itemEl.querySelector('img');
      if (!nameEl || !priceEl) return;
      const name = nameEl.textContent.trim();
      // parse price like $120 -> 120
      const priceText = priceEl.textContent.replace(/[^0-9.,]/g, '').replace(',', '.') || '0';
      const price = parseFloat(priceText) || 0;
      const itemId = makeId(name);

      // Create counter container
      const counterContainer = document.createElement('div');
      counterContainer.className = 'cart-counter-controls';
      counterContainer.style.marginTop = '12px';
      counterContainer.style.display = 'flex';
      counterContainer.style.alignItems = 'center';
      counterContainer.style.justifyContent = 'center';
      counterContainer.style.gap = '8px';

      // Create quantity controls
      const qtyControls = document.createElement('div');
      qtyControls.style.display = 'flex';
      qtyControls.style.alignItems = 'center';
      qtyControls.style.gap = '4px';
      qtyControls.style.border = '1px solid #ddd';
      qtyControls.style.borderRadius = '6px';
      qtyControls.style.overflow = 'hidden';

      // Decrease button
      const decreaseBtn = document.createElement('button');
      decreaseBtn.type = 'button';
      decreaseBtn.textContent = '−';
      decreaseBtn.style.cssText = 'width: 32px; height: 32px; border: none; background: #f5f5f5; cursor: pointer; font-size: 18px; font-weight: 600; color: #333; transition: background 0.2s;';
      decreaseBtn.addEventListener('click', () => {
        const currentQty = Math.max(1, parseInt(qtyInput.value) - 1);
        qtyInput.value = currentQty;
      });
      decreaseBtn.addEventListener('mouseenter', () => decreaseBtn.style.background = '#e0e0e0');
      decreaseBtn.addEventListener('mouseleave', () => decreaseBtn.style.background = '#f5f5f5');

      // Quantity input
      const qtyInput = document.createElement('input');
      qtyInput.type = 'number';
      qtyInput.min = '1';
      qtyInput.value = '1';
      qtyInput.style.cssText = 'width: 50px; height: 32px; border: none; text-align: center; font-size: 14px; font-weight: 600; outline: none;';
      qtyInput.addEventListener('change', () => {
        const val = Math.max(1, parseInt(qtyInput.value) || 1);
        qtyInput.value = val;
      });

      // Increase button
      const increaseBtn = document.createElement('button');
      increaseBtn.type = 'button';
      increaseBtn.textContent = '+';
      increaseBtn.style.cssText = 'width: 32px; height: 32px; border: none; background: #f5f5f5; cursor: pointer; font-size: 18px; font-weight: 600; color: #333; transition: background 0.2s;';
      increaseBtn.addEventListener('click', () => {
        const currentQty = parseInt(qtyInput.value) + 1;
        qtyInput.value = currentQty;
      });
      increaseBtn.addEventListener('mouseenter', () => increaseBtn.style.background = '#e0e0e0');
      increaseBtn.addEventListener('mouseleave', () => increaseBtn.style.background = '#f5f5f5');

      qtyControls.appendChild(decreaseBtn);
      qtyControls.appendChild(qtyInput);
      qtyControls.appendChild(increaseBtn);

      // Add to cart button
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.textContent = 'Agregar';
      addBtn.className = 'add-to-cart-btn';
      addBtn.style.cssText = 'padding: 8px 16px; border: none; background: #000000; color: white; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 14px; transition: background 0.2s, transform 0.1s;';
      addBtn.addEventListener('click', function () {
        const qty = parseInt(qtyInput.value) || 1;
        addToCart({ id: itemId, name, price, img: imgEl ? imgEl.getAttribute('src') : '', qty });
        // Reset quantity after adding
        qtyInput.value = 1;
        // Visual feedback
        const originalText = addBtn.textContent;
        addBtn.textContent = '✓ Agregado';
        addBtn.style.background = '#4caf50';
        setTimeout(() => {
          addBtn.textContent = originalText;
          addBtn.style.background = '#000000';
        }, 1000);
      });
      addBtn.addEventListener('mouseenter', () => addBtn.style.background = '#333');
      addBtn.addEventListener('mouseleave', () => addBtn.style.background = '#000000');
      addBtn.addEventListener('mousedown', () => addBtn.style.transform = 'scale(0.95)');
      addBtn.addEventListener('mouseup', () => addBtn.style.transform = 'scale(1)');

      counterContainer.appendChild(qtyControls);
      counterContainer.appendChild(addBtn);

      // append counter to item-info
      const info = itemEl.querySelector('.item-info');
      if (info) info.appendChild(counterContainer);
    });
  }

  // Render cart page if present
  function renderCartPage() {
    const container = document.getElementById('cartItems');
    if (!container) return; // not on cart page
    const cart = getCart();
    container.innerHTML = '';
    if (cart.length === 0) {
      container.innerHTML = '<p>Tu carrito está vacío.</p>';
      return;
    }

    const list = document.createElement('div');
    list.className = 'cart-list';

    let subtotal = 0;
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';

      const img = document.createElement('img'); img.src = item.img || './img/resource/cart.png'; img.alt = item.name; img.style.width = '80px'; img.style.height = '80px'; img.style.objectFit = 'cover'; img.style.borderRadius = '6px';

      const info = document.createElement('div'); info.className = 'cart-item-info';
      const title = document.createElement('div'); title.textContent = item.name; title.style.fontWeight = '600';
      const price = document.createElement('div'); price.textContent = '$' + formatPrice(item.price);

      const qtyWrap = document.createElement('div'); qtyWrap.className = 'cart-qty';
      const qtyInput = document.createElement('input'); qtyInput.type = 'number'; qtyInput.min = '1'; qtyInput.value = item.qty; qtyInput.style.width = '60px';
      qtyInput.addEventListener('change', () => updateQty(item.id, qtyInput.value));
      const removeBtn = document.createElement('button'); removeBtn.type = 'button'; removeBtn.textContent = 'Eliminar'; removeBtn.style.marginLeft = '8px'; removeBtn.addEventListener('click', () => removeFromCart(item.id));

      qtyWrap.appendChild(qtyInput); qtyWrap.appendChild(removeBtn);

      info.appendChild(title); info.appendChild(price); info.appendChild(qtyWrap);

      row.appendChild(img); row.appendChild(info);
      list.appendChild(row);

      subtotal += item.price * (item.qty || 1);
    });

    // Calcular IVA (22% como en el PDF)
    const IVA_RATE = 0.22;
    const ivaAmount = subtotal * IVA_RATE;
    const total = subtotal + ivaAmount;

    // Crear contenedor para resumen de precios
    const summaryDiv = document.createElement('div');
    summaryDiv.className = 'cart-summary';
    summaryDiv.style.marginTop = '20px';
    summaryDiv.style.padding = '16px';
    summaryDiv.style.background = '#f9f9f9';
    summaryDiv.style.borderRadius = '10px';
    summaryDiv.style.display = 'flex';
    summaryDiv.style.flexDirection = 'column';
    summaryDiv.style.gap = '10px';

    const subtotalDiv = document.createElement('div');
    subtotalDiv.style.display = 'flex';
    subtotalDiv.style.justifyContent = 'space-between';
    subtotalDiv.innerHTML = `<span>Subtotal:</span> <span>$${formatPrice(subtotal)}</span>`;

    const ivaDiv = document.createElement('div');
    ivaDiv.style.display = 'flex';
    ivaDiv.style.justifyContent = 'space-between';
    ivaDiv.innerHTML = `<span>IVA:</span> <span>$${formatPrice(ivaAmount)}</span>`;

    const totalDiv = document.createElement('div');
    totalDiv.className = 'cart-total';
    totalDiv.style.display = 'flex';
    totalDiv.style.justifyContent = 'space-between';
    totalDiv.style.paddingTop = '10px';
    totalDiv.style.borderTop = '2px solid #e0d6d0';
    totalDiv.style.marginTop = '4px';
    totalDiv.innerHTML = `<strong>Total:</strong> <strong>$${formatPrice(total)}</strong>`;

    summaryDiv.appendChild(subtotalDiv);
    summaryDiv.appendChild(ivaDiv);
    summaryDiv.appendChild(totalDiv);

    const checkoutBtn = document.createElement('button');
    checkoutBtn.textContent = 'Finalizar compra';
    checkoutBtn.className = 'btn-primary';
    checkoutBtn.style.marginTop = '16px';
    checkoutBtn.style.width = '100%';
    checkoutBtn.addEventListener('click', async () => {
      if (!confirm(`Finalizar compra por $${formatPrice(total)}?`)) return;
      // intentar generar PDF de factura y luego limpiar carrito
      try {
        await generateInvoicePDF(cart, total);
        alert('Factura descargada. Gracias por tu compra.');
      } catch (err) {
        console.error('Error generando PDF:', err);
        alert('No se pudo generar la factura automáticamente. La compra será registrada localmente.');
      }
      saveCart([]);
      renderCartPage();
    });

    container.appendChild(list);
    container.appendChild(summaryDiv);
    container.appendChild(checkoutBtn);
  }

})();