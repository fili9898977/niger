// Prosty skrypt do obsługi zakładek i poprawy dostępności
document.addEventListener('DOMContentLoaded', ()=>{
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  // helper: smoothly open panel by animating maxHeight
  function openPanel(p){
    p.classList.add('is-active');
    // set explicit maxHeight in next frame to ensure layout (images/fonts) calculated
    requestAnimationFrame(()=>{
      p.style.maxHeight = p.scrollHeight + 'px';
    });
    const onEnd = (e)=>{
      if(e.propertyName === 'max-height'){
        // remove inline maxHeight so content can grow/shrink naturally
        p.style.maxHeight = 'none';
        p.removeEventListener('transitionend', onEnd);
      }
    };
    p.addEventListener('transitionend', onEnd);
  }

  function closePanel(p){
    // set current height (in case it was 'none') then animate to 0
    const current = p.scrollHeight;
    p.style.maxHeight = current + 'px';
    // ensure transition fires, then animate to 0
    requestAnimationFrame(()=>{
      // prepare handler to remove class after transition
      const onEnd = (e)=>{
        if(e.propertyName === 'max-height'){
          p.removeEventListener('transitionend', onEnd);
          // leave maxHeight at 0px (explicit) and remove active class
          p.classList.remove('is-active');
        }
      };
      p.addEventListener('transitionend', onEnd);
      p.style.maxHeight = '0px';
    });
  }

  function activateTab(tab){
    tabs.forEach(t=>{
      const sel = (t===tab).toString();
      t.setAttribute('aria-selected', sel);
    });
    panels.forEach(p=>{
      const shouldBeActive = p.id === tab.getAttribute('aria-controls');
      const isActive = p.classList.contains('is-active');
      if(shouldBeActive && !isActive){
        openPanel(p);
      } else if(!shouldBeActive && isActive){
        closePanel(p);
      }
    });
    // hide hero on desktop when navigating away from overview; on mobile, scroll to panel
    const hero = document.querySelector('.hero');
    const activePanelId = tab.getAttribute('aria-controls');
    const isMobile = window.matchMedia('(max-width:640px)').matches;
    if(activePanelId !== 'panel-overview' && !isMobile){
      hero.classList.add('is-hidden');
    } else {
      hero.classList.remove('is-hidden');
    }
    // on mobile, scroll the selected panel into view for easier access
    if(isMobile){
      const panel = document.getElementById(activePanelId);
      if(panel) panel.scrollIntoView({behavior:'smooth', block:'start'});
    }
    tab.focus();
  }

  tabs.forEach(tab=>{
    tab.addEventListener('click', ()=> activateTab(tab));
    tab.addEventListener('keydown', (e)=>{
      // Left/Right navigation
      const idx = tabs.indexOf(tab);
      if(e.key === 'ArrowRight'){
        activateTab(tabs[(idx+1)%tabs.length]);
        e.preventDefault();
      } else if(e.key === 'ArrowLeft'){
        activateTab(tabs[(idx-1+tabs.length)%tabs.length]);
        e.preventDefault();
      }
    });
  });

  // Replace native <details> with a JS-controlled accordion to avoid native toggle
  // (helps on privacy browsers like Tor Browser which may interfere with native behaviour)
  const nativeDetails = Array.from(document.querySelectorAll('details.detail'));
  const accordions = [];

  nativeDetails.forEach(d=>{
    const summary = d.querySelector('summary');
    const body = d.querySelector('.detail-body');
    // create accordion structure
    const container = document.createElement('div');
    container.className = 'accordion-item';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'accordion-summary';
    btn.innerHTML = summary.innerHTML;
    btn.setAttribute('aria-expanded','false');

    const panel = document.createElement('div');
    panel.className = 'accordion-body';
    // move body contents into panel
    while(body.firstChild){ panel.appendChild(body.firstChild); }

    container.appendChild(btn);
    container.appendChild(panel);

    // replace original details with container
    d.parentNode.replaceChild(container, d);

    accordions.push({container, btn, panel});
  });

  // accordion behaviour
  function openAccordion(a){
    a.container.classList.add('is-open');
    a.btn.setAttribute('aria-expanded','true');
    a.panel.style.opacity = '1';
    requestAnimationFrame(()=>{ a.panel.style.maxHeight = a.panel.scrollHeight + 'px'; });
    const onEnd = (e)=>{ if(e.propertyName === 'max-height'){ a.panel.style.maxHeight = 'none'; a.panel.removeEventListener('transitionend', onEnd); } };
    a.panel.addEventListener('transitionend', onEnd);
  }
  function closeAccordion(a){
    const cur = a.panel.scrollHeight;
    a.panel.style.maxHeight = cur + 'px';
    requestAnimationFrame(()=>{
      const onEnd = (e)=>{ if(e.propertyName === 'max-height'){ a.container.classList.remove('is-open'); a.btn.setAttribute('aria-expanded','false'); a.panel.removeEventListener('transitionend', onEnd); } };
      a.panel.addEventListener('transitionend', onEnd);
      a.panel.style.maxHeight = '0px';
      a.panel.style.opacity = '0';
    });
  }

  accordions.forEach(a=>{
    // init
    a.panel.style.maxHeight = '0px';
    a.panel.style.opacity = '0';
    a.btn.addEventListener('click',(e)=>{
      const open = a.container.classList.contains('is-open');
      if(open){ closeAccordion(a); }
      else {
        // close others
        accordions.forEach(other=>{ if(other!==a && other.container.classList.contains('is-open')) closeAccordion(other); });
        openAccordion(a);
      }
    }, {passive:false});
  });

  // Initialize panels' inline maxHeight for correct first render
  panels.forEach(p=>{
    if(p.classList.contains('is-active')){
      // set to scrollHeight then remove inline after next frame
      p.style.maxHeight = p.scrollHeight + 'px';
      requestAnimationFrame(()=>{ p.style.maxHeight = 'none' });
    } else {
      p.style.maxHeight = '0px';
    }
  });
});
