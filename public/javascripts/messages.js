(() => {
  if (window.Parent) {
    setTimeout(() => {
      Parent.postMessage("Hello world");
      alert("Hello");
    }, 3000);
  } else {
    alert("Parent not found");
  }
})();
