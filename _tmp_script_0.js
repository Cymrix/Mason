
window.onerror = function(msg, url, lineNo, columnNo, error) {
  var errDiv = document.createElement('div');
  errDiv.style.position = 'fixed';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.right = '0';
  errDiv.style.bottom = '0';
  errDiv.style.backgroundColor = 'rgba(255, 0, 0, 0.8)';
  errDiv.style.color = 'white';
  errDiv.style.zIndex = '999999';
  errDiv.style.padding = '20px';
  errDiv.style.fontSize = '24px';
  errDiv.innerHTML = '<b>ERROR:</b> ' + msg + '<br>Line: ' + lineNo + ' Col: ' + columnNo + '<br><pre>' + (error && error.stack ? error.stack : '') + '</pre>';
  document.body.appendChild(errDiv);
  return false;
};
window.addEventListener('unhandledrejection', function(event) {
  var errDiv = document.createElement('div');
  errDiv.style.position = 'fixed';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.right = '0';
  errDiv.style.bottom = '0';
  errDiv.style.backgroundColor = 'rgba(255, 100, 0, 0.8)';
  errDiv.style.color = 'white';
  errDiv.style.zIndex = '999999';
  errDiv.style.padding = '20px';
  errDiv.style.fontSize = '24px';
  errDiv.innerHTML = '<b>UNHANDLED PROMISE:</b> ' + (event.reason ? event.reason : 'Unknown') + '<br><pre>' + (event.reason && event.reason.stack ? event.reason.stack : '') + '</pre>';
  document.body.appendChild(errDiv);
});
