
(function() {
  const origGetId = document.getElementById.bind(document);
  const origQuery = document.querySelector.bind(document);

  let dummyCtx;
  try {
    const canvas = document.createElement('canvas');
    dummyCtx = canvas.getContext('2d');
  } catch(e) {}

  function makeDummy(id) {
    const dummy = document.createElement('div');
    dummy.id = id || 'dummy';
    dummy.value = '';
    dummy.checked = false;
    dummy.options = [];
    dummy.files = [];
    dummy.children = [];
    dummy.style = {};
    dummy.classList = { add: function(){}, remove: function(){}, toggle: function(){}, contains: function(){ return false; } };
    dummy.getContext = function(){ return dummyCtx; };
    dummy.querySelector = function(){ return null; };
    dummy.querySelectorAll = function(){ return []; };
    dummy.addEventListener = function(){};
    dummy.removeEventListener = function(){};
    dummy.appendChild = function(c){ return c; };
    dummy.removeChild = function(c){ return c; };
    dummy.setAttribute = function(){};
    dummy.getAttribute = function(){ return null; };

    if (typeof Proxy !== 'undefined') {
      return new Proxy(dummy, {
        get: function(target, prop) {
          if (prop in target) return target[prop];
          if (prop === Symbol.iterator) return [][Symbol.iterator];
          if (typeof prop === 'string' && prop.startsWith('on')) return function(){};
          return function(){};
        }
      });
    }
    return dummy;
  }

    document.getElementById = function(id) {
    const el = origGetId(id);
    if (el) return el;
    return makeDummy(id);
  };

  document.querySelector = function(sel) {
    const el = origQuery(sel);
    if (el) return el;
    if (sel && typeof sel === 'string' && sel.startsWith('#')) {
      return makeDummy(sel.slice(1));
    }
    return null;
  };
})();
