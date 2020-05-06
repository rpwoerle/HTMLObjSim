var initFrame;

document.addEventListener("DOMContentLoaded", function (event) {
  console.log("DOM fully loaded and parsed");
  initFrame = document.getElementById("workFrame").innerHTML;

  document.getElementById("jsinput").addEventListener("keyup", function(e) {
    if (e.ctrlKey && e.key == "Enter") {
      e.stopPropagation();
      runCmd();
    }
  });
});

function init() {
  initFrame = document.getElementById("workFrame").innerHTML;
}

function reInit() {
  document.getElementById("workFrame").innerHTML = initFrame;
}

function runCmd() {
  var inp = document.getElementById("jsinput").value.trim();
  inp = inp.replace(new RegExp("\n", "g"), "");
  var arr = inp.split(";");
  console.log("Input Array = " + arr.toString());

  arr.forEach(function (item) {
    if (!item || item.slice(0, 2) == "//") return;            // ignore empty input lines or comments
    if (item.slice(0, 9) == "document.") item = item.substr(9);// remove leading document
    if (item.charAt(0) == ":") {                              // leading : means direct input
      eval(item.substr(1).trim());
      return;
    }
    console.log("Current input = " + item);

    var regex = String.fromCharCode(0x5c) + "(.*" + String.fromCharCode(0x5c) + ")";  // escape \ for mebis misbehavior on backslash!
    console.log("regex = " + regex);
    var args = item.match(new RegExp(regex));                 // find any arguments in brackets
    if (args) {
      args = args[0];                                         // remove array
      var argsArr = args.slice(1, args.length - 1).split(",");
      argsArr.forEach(function (arg, idx, arr) { arr[idx] = unQuote(arg.trim()); }) // trim each argument
      console.log("Arguments = " + argsArr.toString());
      item = item.replace(args, "");                          // remove arguments for now
    }
    var isstyle = item.search(".style") == -1 ? false : true;
    if (isstyle) item = item.replace(".style", "");           // remove "style" if present
    var showRes = item.charAt(0) == "?" ? true : false;       // results requested?
    if (showRes) item = item.slice(1).trim();                 // remove leading ? if present

    if (item.indexOf("=") > 0) {                              // input in attribut form?
      var last = item.indexOf("=") > 0 ? item.indexOf("=") : item.length;
      var attrval = item.slice(last + 1, item.length).trim(); // get attribute value
      item = item.replace(attrval, "").trim();                // remove attribut value
      item = item.replace("=", "").trim();                    // remove trailing "="
    }
    var elem = item.slice(item.lastIndexOf(".")).trim();      // get attribute or method
    var obj = item.slice(0, item.lastIndexOf(".")).trim();    // get the object

    console.log("Output requested? = " + showRes);
    console.log("Style requested? = " + isstyle);
    console.log("Object = " + obj);
    if (attrval) {                                            // setting an attribute
      console.log("Attribute = " + elem);
      console.log("Attribute value = " + attrval);
    } else {
      if (args)                                               // calling a method
        console.log("Method call = " + elem + args);
      else                                                    // requesting an attribute
        console.log("Attribute = " + elem);
    }

    if (!document.getElementById(obj)) {                      // if obj doesn't exist,
      var arrObj = obj.split("."); 
      if (arrObj[arrObj.length - 1].startsWith("Wort")) {     // if last (sub-)obj is a word
        var idx = arrObj.pop().substr(4) - 1;                 // get the index of the word
        var parentNode = document.getElementById(arrObj.join("."));
        if (!parentNode) {                                    // return if parent doesn't exist
          alert("Fehler: Objekt existiert nicht: " + obj);
          return;
        }
        var arr = [];                                         // split text by word or HTML Tag
        for (var i = 0, children = parentNode.childNodes; i < children.length; i++) {
          if (children[i].nodeType === 3) {                   // if just text, store in array
            arr = arr.concat(children[i].nodeValue.trim().split(/\s+/));
          } else {
            arr.push(children[i].outerHTML);                  // if HTML Tag, store the whole tag
          }
        }
        if (arr[idx].match(/>.+</)) {                         // add a span tag with id WORTx to the text
          arr[idx] = arr[idx].replace(/>(.+?)</, "><span id='" + obj + "'>$1</span><");
        } else {
          arr[idx] = "<span id='" + obj + "'>" + arr[idx] + "</span>";
        }
        parentNode.innerHTML = arr.join(" ");
      }
    }

    var jsObj = document.getElementById(obj);
    switch (elem) {                                           // special methods
      case ".addAttribute":
        jsObj.setAttribute(argsArr[0], argsArr[1]);
        return;
      case ".addElement":
        var li = document.createElement("li");
        li.appendChild(document.createTextNode(argsArr[0]));
        if (argsArr[1]) {
          li.setAttribute("id", obj + "." + argsArr[1].replace(new RegExp(" ", "g"), ""));
        }
        jsObj.appendChild(li);
        return;
      case ".replaceText":
        var txt = jsObj.innerHTML;
        jsObj.innerHTML = txt.replace(new RegExp(argsArr[0], "g"), argsArr[1]);
        return;
    }

    if (attrval) {                                          // now create the command
      var cmd = elem + "=" + attrval;                       // set new attribute value
    } else {
      var cmd = elem + (args ? args : "");                  // call methode or get attribute
    }

    if (isstyle) cmd = ".style" + cmd;                      // change a style attribute

    console.log("Command = " + cmd);


    if (showRes) {
      var retry = false;                                    // display any results
      var evalCmd = "document.getElementById('results').innerHTML = " +
        "document.getElementById('" + obj + "')" + cmd;
      try {                                                 // first try
        eval(evalCmd);
      } catch (err) {
        console.log("Error = " + err);
        retry = true;
      }

      console.log(document.getElementById('results').innerHTML);

      if (retry || (document.getElementById('results').innerHTML == "undefined" && !args)) {
        cmd = ".getAttribute('" + elem.slice(1) + "')";
        evalCmd = "document.getElementById('results').innerHTML = " +
          "document.getElementById('" + obj + "')" + cmd;
        try {   // if attribute set by HTML we need to use getAttribute() instead of ".attribute" notation
          eval(evalCmd);                                   // second try
        }
        catch (err) {                                      // show error if caught
          alert("Syntaxfehler oder unbekannte Methode/Attribut!");
        }
      }
    } else {                                              // no results display
      var evalCmd = "document.getElementById('" + obj + "')" + cmd;
      try {
        eval(evalCmd);
      }
      catch (err) {
        alert("Syntaxfehler oder unbekannte Methode/Attribut!");
      }
    }
    console.log("eval command = " + evalCmd);
  });
}

// Helper functions
function unQuote(str) {
  return str.replace(/^"(.*)"$/, '$1');
}

// button event callbacks
function toggleTips() {
  var objArr = document.getElementsByClassName("tooltip")
  if (objArr[0].style.display == "inline" || !objArr[0].style.display)
    Array.from(objArr).forEach(function (item) { item.style.display = "none"; }); // alternative: [].slice.call(htmlCollection)
  else
    Array.from(objArr).forEach(function (item) { item.style.display = "inline"; });
}

function toggleExtraTip(src) {
  src = document.getElementById(src);
  if (src.style.display == "none" || src.style.display == "")
    src.style.display = "inline";
  else
    src.style.display = "none";
}
