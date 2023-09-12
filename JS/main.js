// page Load Animation

// Wait for the page to load
window.addEventListener("load", function () {
  // Get the page loader and content elements
  const pageLoader = document.querySelector(".page-loader");
  const content = document.querySelector(".content");

  // Fade out the loader
  setTimeout(function () {
    pageLoader.style.opacity = "0";
  }, 1500); // Adjust the duration as needed

  // Hide the loader and fade in the content
  setTimeout(function () {
    pageLoader.style.display = "none";
    content.style.opacity = "1";
  }, 2000); // Adjust the duration as needed
});

// Handle fading out with background color when navigating away (e.g., clicking a link)
window.addEventListener("beforeunload", function () {
  const pageLoader = document.querySelector(".page-loader");
  pageLoader.style.display = "block"; // Show loader
  pageLoader.style.opacity = "1"; // Make it fully visible
});

// page Load Animation

////////////

// scroll function

var ScrollOut = (function () {
  "use strict";

  function clamp(v, min, max) {
    return min > v ? min : max < v ? max : v;
  }
  function sign(x) {
    return +(x > 0) - +(x < 0);
  }
  function round(n) {
    return Math.round(n * 10000) / 10000;
  }

  var cache = {};
  function replacer(match) {
    return "-" + match[0].toLowerCase();
  }
  function hyphenate(value) {
    return cache[value] || (cache[value] = value.replace(/([A-Z])/g, replacer));
  }

  /** find elements */
  function $(e, parent) {
    return !e || e.length === 0
      ? // null or empty string returns empty array
        []
      : e.nodeName
      ? // a single element is wrapped in an array
        [e]
      : // selector and NodeList are converted to Element[]
        [].slice.call(
          e[0].nodeName
            ? e
            : (parent || document.documentElement).querySelectorAll(e)
        );
  }
  function setAttrs(el, attrs) {
    // tslint:disable-next-line:forin
    for (var key in attrs) {
      if (key.indexOf("_")) {
        el.setAttribute("data-" + hyphenate(key), attrs[key]);
      }
    }
  }
  function setProps(cssProps) {
    return function (el, props) {
      for (var key in props) {
        if (key.indexOf("_") && (cssProps === true || cssProps[key])) {
          el.style.setProperty("--" + hyphenate(key), round(props[key]));
        }
      }
    };
  }

  var clearTask;
  var subscribers = [];
  function loop() {
    clearTask = 0;
    subscribers.slice().forEach(function (s2) {
      return s2();
    });
    enqueue();
  }
  function enqueue() {
    if (!clearTask && subscribers.length) {
      clearTask = requestAnimationFrame(loop);
    }
  }
  function subscribe(fn) {
    subscribers.push(fn);
    enqueue();
    return function () {
      subscribers = subscribers.filter(function (s) {
        return s !== fn;
      });
      if (!subscribers.length && clearTask) {
        cancelAnimationFrame(clearTask);
        clearTask = 0;
      }
    };
  }

  function unwrap(value, el, ctx, doc) {
    return typeof value === "function" ? value(el, ctx, doc) : value;
  }
  function noop() {}

  /**
   * Creates a new instance of ScrollOut that marks elements in the viewport with
   * an "in" class and marks elements outside of the viewport with an "out"
   */
  // tslint:disable-next-line:no-default-export
  function main(opts) {
    // Apply default options.
    opts = opts || {};
    // Debounce onChange/onHidden/onShown.
    var onChange = opts.onChange || noop;
    var onHidden = opts.onHidden || noop;
    var onShown = opts.onShown || noop;
    var onScroll = opts.onScroll || noop;
    var props = opts.cssProps ? setProps(opts.cssProps) : noop;
    var se = opts.scrollingElement;
    var container = se ? $(se)[0] : window;
    var doc = se ? $(se)[0] : document.documentElement;
    var rootChanged = false;
    var scrollingElementContext = {};
    var elementContextList = [];
    var clientOffsetX, clientOffsety;
    var sub;
    function index() {
      elementContextList = $(
        opts.targets || "[data-scroll]",
        $(opts.scope || doc)[0]
      ).map(function (el) {
        return { element: el };
      });
    }
    function update() {
      // Calculate position, direction and ratio.
      var clientWidth = doc.clientWidth;
      var clientHeight = doc.clientHeight;
      var scrollDirX = sign(
        -clientOffsetX + (clientOffsetX = doc.scrollLeft || window.pageXOffset)
      );
      var scrollDirY = sign(
        -clientOffsety + (clientOffsety = doc.scrollTop || window.pageYOffset)
      );
      var scrollPercentX =
        doc.scrollLeft / (doc.scrollWidth - clientWidth || 1);
      var scrollPercentY =
        doc.scrollTop / (doc.scrollHeight - clientHeight || 1);
      // Detect if the root context has changed.
      rootChanged =
        rootChanged ||
        scrollingElementContext.scrollDirX !== scrollDirX ||
        scrollingElementContext.scrollDirY !== scrollDirY ||
        scrollingElementContext.scrollPercentX !== scrollPercentX ||
        scrollingElementContext.scrollPercentY !== scrollPercentY;
      scrollingElementContext.scrollDirX = scrollDirX;
      scrollingElementContext.scrollDirY = scrollDirY;
      scrollingElementContext.scrollPercentX = scrollPercentX;
      scrollingElementContext.scrollPercentY = scrollPercentY;
      var childChanged = false;
      for (var index_1 = 0; index_1 < elementContextList.length; index_1++) {
        var ctx = elementContextList[index_1];
        var element = ctx.element;
        // find the distance from the element to the scrolling container
        var target = element;
        var offsetX = 0;
        var offsetY = 0;
        do {
          offsetX += target.offsetLeft;
          offsetY += target.offsetTop;
          target = target.offsetParent;
        } while (target && target !== container);
        // Get element dimensions.
        var elementHeight = element.clientHeight || element.offsetHeight || 0;
        var elementWidth = element.clientWidth || element.offsetWidth || 0;
        // Find visible ratios for each element.
        var visibleX =
          (clamp(
            offsetX + elementWidth,
            clientOffsetX,
            clientOffsetX + clientWidth
          ) -
            clamp(offsetX, clientOffsetX, clientOffsetX + clientWidth)) /
          elementWidth;
        var visibleY =
          (clamp(
            offsetY + elementHeight,
            clientOffsety,
            clientOffsety + clientHeight
          ) -
            clamp(offsetY, clientOffsety, clientOffsety + clientHeight)) /
          elementHeight;
        var intersectX = visibleX === 1 ? 0 : sign(offsetX - clientOffsetX);
        var intersectY = visibleY === 1 ? 0 : sign(offsetY - clientOffsety);
        var viewportX = clamp(
          (clientOffsetX - (elementWidth / 2 + offsetX - clientWidth / 2)) /
            (clientWidth / 2),
          -1,
          1
        );
        var viewportY = clamp(
          (clientOffsety - (elementHeight / 2 + offsetY - clientHeight / 2)) /
            (clientHeight / 2),
          -1,
          1
        );
        var visible = void 0;
        if (opts.offset) {
          visible =
            unwrap(opts.offset, element, ctx, doc) <= clientOffsety ? 1 : 0;
        } else if (
          (unwrap(opts.threshold, element, ctx, doc) || 0) <
          visibleX * visibleY
        ) {
          visible = 1;
        } else {
          visible = 0;
        }
        var changedVisible = ctx.visible !== visible;
        var changed =
          ctx._changed ||
          changedVisible ||
          ctx.visibleX !== visibleX ||
          ctx.visibleY !== visibleY ||
          ctx.index !== index_1 ||
          ctx.elementHeight !== elementHeight ||
          ctx.elementWidth !== elementWidth ||
          ctx.offsetX !== offsetX ||
          ctx.offsetY !== offsetY ||
          ctx.intersectX !== ctx.intersectX ||
          ctx.intersectY !== ctx.intersectY ||
          ctx.viewportX !== viewportX ||
          ctx.viewportY !== viewportY;
        if (changed) {
          childChanged = true;
          ctx._changed = true;
          ctx._visibleChanged = changedVisible;
          ctx.visible = visible;
          ctx.elementHeight = elementHeight;
          ctx.elementWidth = elementWidth;
          ctx.index = index_1;
          ctx.offsetX = offsetX;
          ctx.offsetY = offsetY;
          ctx.visibleX = visibleX;
          ctx.visibleY = visibleY;
          ctx.intersectX = intersectX;
          ctx.intersectY = intersectY;
          ctx.viewportX = viewportX;
          ctx.viewportY = viewportY;
          ctx.visible = visible;
        }
      }
      if (!sub && (rootChanged || childChanged)) {
        sub = subscribe(render);
      }
    }
    function render() {
      maybeUnsubscribe();
      // Update root attributes if they have changed.
      if (rootChanged) {
        rootChanged = false;
        setAttrs(doc, {
          scrollDirX: scrollingElementContext.scrollDirX,
          scrollDirY: scrollingElementContext.scrollDirY,
        });
        props(doc, scrollingElementContext);
        onScroll(doc, scrollingElementContext, elementContextList);
      }
      var len = elementContextList.length;
      for (var x = len - 1; x > -1; x--) {
        var ctx = elementContextList[x];
        var el = ctx.element;
        var visible = ctx.visible;
        var justOnce = el.hasAttribute("scrollout-once") || false; // Once
        if (ctx._changed) {
          ctx._changed = false;
          props(el, ctx);
        }
        if (ctx._visibleChanged) {
          setAttrs(el, { scroll: visible ? "in" : "out" });
          onChange(el, ctx, doc);
          (visible ? onShown : onHidden)(el, ctx, doc);
        }
        // if this is shown multiple times, keep it in the list
        if (visible && (opts.once || justOnce)) {
          // or if this element just display it once
          elementContextList.splice(x, 1);
        }
      }
    }
    function maybeUnsubscribe() {
      if (sub) {
        sub();
        sub = undefined;
      }
    }
    // Run initialize index.
    index();
    update();
    render();
    // Collapses sequential updates into a single update.
    var updateTaskId = 0;
    var onUpdate = function () {
      updateTaskId =
        updateTaskId ||
        setTimeout(function () {
          updateTaskId = 0;
          update();
        }, 0);
    };
    // Hook up document listeners to automatically detect changes.
    window.addEventListener("resize", onUpdate);
    container.addEventListener("scroll", onUpdate);
    return {
      index: index,
      update: update,
      teardown: function () {
        maybeUnsubscribe();
        window.removeEventListener("resize", onUpdate);
        container.removeEventListener("scroll", onUpdate);
      },
    };
  }

  return main;
})();

ScrollOut({
  targets: "header,div,img,section,h1,nav,a,span,li",
});

// scroll function

// create function to open mega menu by click

let megaIcon = document.querySelector(".mega-icon");
let megaMenu = document.querySelector(".mega-menu");
let closeIcon = document.querySelector(".close-icon");
const content = document.querySelector(".content");

megaIcon.addEventListener("click", function (e) {
  e.stopPropagation();
  megaMenu.classList.toggle("active");
});

content.addEventListener("click", function () {
  megaMenu.classList.remove("active");
});
closeIcon.addEventListener("click", function () {
  megaMenu.classList.remove("active");
});
//

// create a function that make All fade animation

// Fade Up
document.addEventListener("DOMContentLoaded", function () {
  const fadeUpElements = document.querySelectorAll(".fade-up");
});

// Fade Up

// Fade Down
document.addEventListener("DOMContentLoaded", function () {
  const fadeDownElements = document.querySelectorAll(".fade-down");
});

// Fade-Down

// fade left and right

document.addEventListener("DOMContentLoaded", function () {
  const fadeLeftElements = document.querySelectorAll(".fade-left");
  const fadeRightElements = document.querySelectorAll(".fade-right");
});

// Fade in

document.addEventListener("DOMContentLoaded", function () {
  const fadeInElements = document.querySelectorAll(".fade-in");
});

//make function to counter the progress

let nums = document.querySelectorAll(".progress-counter .prog .num");
let section = document.querySelector(".about");
let started = false;

window.onscroll = function () {
  if (window.scrollY >= section.offsetLeft) {
    if (!started) {
      nums.forEach((num) => starCount(num));
    }
    started = true;
  }
};

// function starCount(el) {
//   let goal = el.dataset.goal;
//   let count = setInterval(() => {
//     el.textContent++;
//     if (el.textContent == goal) {
//       clearInterval(count);
//     }
//   }, 2500 / goal);
// }

function starCount(el) {
  let goal = el.dataset.goal;
  let count = setInterval(() => {
    el.textContent++;
    if (el.textContent == goal) {
      clearInterval(count);
    }
    if (goal !== "1996") {
      el.textContent = "+" + el.textContent; // Add a plus sign before the number
    }
  }, 5000 / goal);
}

// function starCount(el) {
//   let goal = el.dataset.goal;
//   if (goal !== "1996") {
//     el.textContent = "+" + el.textContent; // Add a plus sign before the number
//   }
//   let count = setInterval(() => {
//     el.textContent++;
//     if (el.textContent == goal) {
//       clearInterval(count);
//     }
//   }, 2500 / goal);
// }
// starCount(document.querySelectorAll(".progress-counter .prog .num")[0]);

//make function to counter the progress

// mouse function

// change the background when hover

// let backgroundChanger = document.querySelector(".bagrnd");
// let card1 = document.querySelector(".c1");
// let card2 = document.querySelector(".c2");
// let card3 = document.querySelector(".c3");
// let card4 = document.querySelector(".c4");
// let imageR = card1.style.backgroundColor;

// card1.addEventListener("mouseover", () => {
//   backgroundChanger.style.backgroundImage = "url(/images/img1.jpg)";
// });
// card2.addEventListener("mouseover", () => {
//   backgroundChanger.style.backgroundImage = "url(/images/img2.jpg)";
// });
// card3.addEventListener("mouseover", () => {
//   backgroundChanger.style.backgroundImage = "url(/images/img3.jpg)";
// });
// card4.addEventListener("mouseover", () => {
//   backgroundChanger.style.backgroundImage = "url(/images/img4.jpg)";
// });

// card1.addEventListener("mouseleave", () => {
//   backgroundChanger.style.backgroundImage = imageR;
// });
// card2.addEventListener("mouseleave", () => {
//   backgroundChanger.style.backgroundImage = imageR;
// });
// card3.addEventListener("mouseleave", () => {
//   backgroundChanger.style.backgroundImage = imageR;
// });
// card4.addEventListener("mouseleave", () => {
//   backgroundChanger.style.backgroundImage = imageR;
// });

///

//

// let links = document.querySelectorAll(".links .link");

// links.forEach.addEventListener("click,", (link) => {
//   document.style.cssText = "opacity: 0;";
// });

// Swiper
var swiper = new Swiper(".mySwiper", {
  slidesPerView: 3,
  spaceBetween: 30,
  pagination: {
    el: ".swiper-pagination",
    clickable: true,
  },

  breakpoints: {
    0: { slidesPerView: 1 },
    520: { slidesPerView: 2 },
    950: {
      slidesPerView: 3,
    },
  },
});

//
let getStartedLink = document.querySelector(".getStarted .link-btn");
let getStartedSpan = document.querySelector(".getStarted span");
let getStartedP = document.querySelector(".getStarted .fast");

getStartedLink.addEventListener("mouseover", function () {
  getStartedP.classList.add("active");
});
getStartedLink.addEventListener("mouseout", function () {
  getStartedP.classList.remove("active");
});

