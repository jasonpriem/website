
var oabutton_ui = function(api_key) {
  // =============================================
  // declare vars and functions

  var page_url;

  function handleAvailabilityResponse(response) {
    // The main extension logic - do different things depending on what the API returns about URL's status
    oab.debugLog('API response: ' + JSON.stringify(response.data));

    document.getElementById('buttonstatus').className = document.getElementById('buttonstatus').className.replace('collapse','').replace('  ',' ');
    document.getElementById('loading_area').className = 'row collapse';
    
    //change UI if a library bookmarklet and library copies appear to be available
    if (response.data.library) {
      if (oab.library === 'imperial') {
        // TODO could configure a list of terms for libraries somewhere, or always provide a generic linked set?
        document.getElementById('terms').innerHTML = 'By submitting an inter-library loan request you agree to the <a target="_blank" href="https://openaccessbutton.org"><b>terms</b></a>';
      }
      var title;
      if (response.data.library.repository) {
        document.getElementById('iconarticle').style.backgroundColor = '#398bc5';
        title = 'Available in local repository! Click to open';
        document.getElementById('iconarticle').setAttribute('alt',title);
        document.getElementById('iconarticle').setAttribute('title',title);
        document.getElementById('iconarticle').setAttribute('href',response.data.library.repository.repository);
        document.getElementById('iconarticletext').innerHTML = 'Available!';
      } else if (response.data.library.journal && response.data.library.journal.library) {
        document.getElementById('iconarticle').style.backgroundColor = '#398bc5';
        title = 'This journal is accessible via institutional login. Sign in to the site to gain access.';
        document.getElementById('iconarticle').setAttribute('data-action','signin');
        document.getElementById('iconarticle').setAttribute('alt',title);
        document.getElementById('iconarticle').setAttribute('title',title);
        document.getElementById('iconarticle').setAttribute('href',response.data.library.repository);
        document.getElementById('iconarticletext').innerHTML = 'Accessible (login)';
      } else if (response.data.library.local && response.data.library.local.length) {
        document.getElementById('iconarticle').style.backgroundColor = '#398bc5';
        title = 'This item appears to be available locally. Click to view locations.';
        document.getElementById('iconarticle').setAttribute('data-action','locals');
        document.getElementById('iconarticle').setAttribute('alt',title);
        document.getElementById('iconarticle').setAttribute('title',title);
        document.getElementById('iconarticletext').innerHTML = 'Available locally';
        var locals = '';
        for ( var l in response.data.library.local) {
          var libs = response.data.library.local[l]
          if ( !(libs instanceof Array) ) libs = [libs];
          for ( var li in libs ) {
            locals += libs[li].title + ' <b>' + libs[li].library.status + '</b> in ' + libs[li].library.collection.replace('In ','') + '<br>';
          }
        }
        document.getElementById('library').innerHTML = locals;
        document.getElementById('library').style.backgroundColor = '#398bc5';
      } else {
        document.getElementById('ill').className = 'collapse';
        title = 'This item does not appear to be available. Click to start an inter-library loan request.';
        document.getElementById('iconarticle').setAttribute('data-action','ill');
        document.getElementById('iconarticle').setAttribute('alt',title);
        document.getElementById('iconarticle').setAttribute('title',title);
        document.getElementById('iconarticletext').innerHTML = 'Request an inter-library loan';
      }
    }
    
    // change UI if a library bookmarklet and library copies appear to be available
    /*if (response.data.library) {
      if (response.data.library.title) document.getElementById('title').value = response.data.library.title;
      if (response.data.library.local && response.data.library.local.length) {
        if (response.data.availability.length === 0) {
          document.getElementById('iconarticle').style.display = "none";
          if (oab.dataable) document.getElementById('icondata').style.display = "none";          
        }
        var locals = '';
        for ( var l in response.data.library.local) {
          var libs = response.data.library.local[l]
          if ( !(libs instanceof Array) ) libs = [libs];
          for ( var li in libs ) {
            var lib = libs[li];
            if (lib.repository) {
              locals += '<a target="_blank" href="' + lib.repository + '" alt="click to open" title="click to open">' + lib.title + ' <b>available online in repository</b></a><br>';              
            } else {
              // TODO add something if a journal availability rather than an article availability
              if (lib.type === 'journal') {
                locals += 'We have access. Try logging in.';
              } else {
                locals += lib.title + ' <b>' + lib.library.status + '</b> in ' + lib.library.collection.replace('In ','') + '<br>';
              }
            }
          }
        }
        document.getElementById('library').innerHTML = locals;
        document.getElementById('library').style.backgroundColor = '#398bc5';
        var ilr = 'Not the right article';
        if (response.data.library.journal) ilr += '/journal';
        ilr += '?<br>' + document.getElementById('iconill').innerHTML.split('.')[1]
        document.getElementById('iconill').innerHTML = ilr;
      }
    }*/

    // Change the UI depending on availability, existing requests, and the data types we can open new requests for.
    if (response.data.availability.length > 0) {
      var title = 'We found it! Click to open';
      for ( var avail_entry of response.data.availability ) {
        if ( avail_entry.type === 'article' && oab.library && ( response.data.library && response.data.library.journal && response.data.library.journal.library ) ) {
          // do nothing, prioritise journal subscription access?
        } else {
          document.getElementById('icon'+avail_entry.type).style.backgroundColor = '#398bc5';
          document.getElementById('icon'+avail_entry.type).setAttribute('alt',title);
          document.getElementById('icon'+avail_entry.type).setAttribute('title',title);
          document.getElementById('icon'+avail_entry.type).setAttribute('href',avail_entry.url);
          //document.getElementById('icon'+avail_entry.type).className = 'need'; // it could have had disabled tag added to it, but should be removed if available
          document.getElementById('icon'+avail_entry.type+'text').innerHTML = 'Open '+avail_entry.type;
        }
      }
    }
    if (response.data.requests.length > 0 && oab.supportable) {
      for (var requests_entry of response.data.requests) {
        var rnd = document.getElementById('icon'+requests_entry.type).innerHTML;
        if (requests_entry.usupport || requests_entry.ucreated) {
          document.getElementById('icon'+requests_entry.type).setAttribute('href',oab.site_address + '/request/' + requests_entry._id);
          rnd = rnd.replace('Unavailable','View request');
        } else {
          document.getElementById('icon'+requests_entry.type).setAttribute('data-action','support');
          document.getElementById('icon'+requests_entry.type).setAttribute('data-support',requests_entry._id);
          rnd = rnd.replace('Unavailable','Support request');
        }
        document.getElementById('icon'+requests_entry.type+'text').innerHTML = rnd;
      }
    }
    if (response.data.accepts.length > 0 && oab.requestable) {
      for (var accepts_entry of response.data.accepts) {
        document.getElementById('icon'+accepts_entry.type).setAttribute('data-action','create');
        if (api_key) {
          var and = document.getElementById('icon'+accepts_entry.type).innerHTML;
          and = and.replace('Unavailable','Request '+accepts_entry.type);
          document.getElementById('icon'+accepts_entry.type+'text').innerHTML = and;
        }
      }
    }
  }

  function handleRequestResponse(response) {
    document.getElementById('icon_submitting').className = 'collapse';
    document.getElementById('story_div').className += ' collapse';
    document.getElementById('story').value = "";
    var url = oab.site_address + '/request/';
    url += response.rid ? response.rid : response._id
    var msg = "<p>Thank you for ";
    msg += document.getElementById('submit').getAttribute('data-action') === 'create' ? 'creat' : 'support';
    msg += "ing this request!</p>";
    msg += "<p>Please go and view the request, it may need additional details.</p>"
    msg += '<p>It should be open in a new tab, but if you do not see it <a class="label label-info" target="_blank" href="' + url + '">click here</a>';
    document.getElementById('message').innerHTML = msg;
    try {
      chrome.tabs.create({url: url, active: false});
    } catch(err) {
      // try opening direct with js
      oab.debugLog('Cannot open new tab for ' + url + ' - probably in the test page. Trying to open directly with js')
      window.open(url,'_blank');
    }
  }

  function handleILLResponse(response) {
    document.getElementById('icon_submitting').className = 'collapse';
    document.getElementById('story_div').className += ' collapse';
    document.getElementById('title').value = "";
    document.getElementById('id').value = "";
    document.getElementById('story').value = "";
    var msg = "<p>Thank you for submitting an inter-library loan request!</p>";
    msg += "You will receive an email confirmation and can track progress via your library system.";
    document.getElementById('message').innerHTML = msg;
  }

  // =============================================
  // These are run when the extension loads

  try {
    chrome.tabs.executeScript({
      code: 'chrome.storage.local.set({dom: document.all[0].outerHTML });'
    });
  } catch(err) {}

  var noapimsg = "You don't appear to be signed up. If you sign up you can create and support requests.";
  noapimsg += '<br>Please <a id="noapikey" class="label" style="background-color:#398bc5;" href="' + oab.site_address + oab.register_address;
  noapimsg += '">signup or login</a> now.';

  var start = function() {
    try {
      chrome.tabs.query({currentWindow: true, active: true}, function(tabs) {
        // Start by checking the status of the URL for the current tab
        page_url = tabs[0].url.split('#')[0];
        oab.debugLog('Sending availability query via chrome tabs for URL ' + page_url);
        var qry = {url:page_url};
        try {
          chrome.storage.local.get({dom : ''}, function(items) {
            if (items.dom !== '') qry.dom = items.dom;
            oab.sendAvailabilityQuery(api_key, qry, handleAvailabilityResponse, oab.handleAPIError);
          });
        } catch (err) {
          oab.sendAvailabilityQuery(api_key, qry, handleAvailabilityResponse, oab.handleAPIError);
        }
      });
    } catch (err) {
      oab.debugLog('Sending availability query direct from within page');
      page_url = window.location.href.split('#')[0];
      if (page_url.indexOf('apikey=') !== -1) page_url = page_url.split('?apikey=')[0].split('&apikey=')[0].split('apikey=')[0];
      oab.sendAvailabilityQuery(api_key, {url:page_url, dom: document.all[0].outerHTML}, handleAvailabilityResponse, oab.handleAPIError);
    }
  }

  try {
    chrome.storage.local.get({api_key : ''}, function(items) {
      if (items.api_key === '' && oab.signup) {
        oab.displayMessage(noapimsg);
        document.getElementById('noapikey').onclick = function () {
          chrome.tabs.create({'url': oab.site_address + oab.register_address});
        };
        start();
      } else {
        api_key = items.api_key;
        oab.debugLog('api key is available from chrome storage: ' + api_key);
        start();
      }
    });
  } catch (err) {
    var apik;
    try {
      apik = window.location.href.split('apikey=')[1].split('&')[0].split('#')[0];
    } catch(err) {}
    if (apik) {
      // this is just useful for testing...
      oab.debugLog('Got api key ' + apik + ' direct from url param for testing');
      api_key = apik;
    } else if (!api_key) {
      oab.displayMessage('(you are on the test page - you can provide an apikey url param to override this msg).<br>' + noapimsg);
    }
    start();
  }


  // =============================================
  // bind actions to the elements

  var needs = document.getElementsByClassName('need');
  for ( var n in needs ) {
    needs[n].onclick = function(e) {
      var href = e.target.getAttribute('href');
      if (href === undefined || href === null) href = e.target.parentNode.getAttribute('href');
      var type = e.target.getAttribute('data-type');
      if (type === undefined || type === null) type = e.target.parentNode.getAttribute('data-type');
      var supports = e.target.getAttribute('data-support');
      if (supports === undefined || supports === null) supports = e.target.parentNode.getAttribute('data-support');
      var action = e.target.getAttribute('data-action');
      if (action === undefined || action === null) action = e.target.parentNode.getAttribute('data-action');

      if ( href === '#' && api_key ) {
        e.preventDefault();
        if (action === 'locals') {
          document.getElementById('library').className = '';
        } else if (action === 'signin') {
          // nothing to do - user should be trying to sign in
        } else {
          var what = action === 'ill' ? 'inter-library loan' : type;
          var ask = action === 'support' ? 'Someone else has started a request for this ' + what + '. Add your support. ' : 'Create a new ' + what + ' request. ';
          if (action === 'ill') what = 'article';
          ask += 'How would getting access to this ' + what + ' help you?';
          if (action !== 'support' && type !== 'ill') ask += ' This message will be sent to the author.';
          document.getElementById('story').setAttribute('placeholder',ask);
          document.getElementById('submit').setAttribute('data-type',type);
          document.getElementById('submit').setAttribute('data-support',supports);
          document.getElementById('submit').setAttribute('data-action',action);
          if ( action === 'support' ) {
            document.getElementById('submit').innerHTML = document.getElementById('submit').innerHTML.replace('create','support');
          } else {
            document.getElementById('submit').innerHTML = document.getElementById('submit').innerHTML.replace('support','create');
          }
          if (action === 'ill') {
            document.getElementById('submit').removeAttribute('disabled');
            document.getElementById('submit').style.backgroundColor = '#398bc5';
            document.getElementById('submit').innerHTML = 'Submit inter-library loan request';
            document.getElementById('story').className = 'collapse';
          }
          document.getElementById('story_div').className = '';
        }
      } else if (chrome && chrome.tabs && api_key) {
        chrome.tabs.create({'url': href});
      }
    }
  }
  
  document.getElementById('ill').onclick = function (e) {
    e.preventDefault();
    //var ask = 'Create a new inter-library loan request. How would getting access to this item help you?';
    //document.getElementById('story').setAttribute('placeholder',ask);
    document.getElementById('submit').setAttribute('data-type','ill');
    document.getElementById('submit').setAttribute('data-action','ill');
    document.getElementById('submit').removeAttribute('disabled');
    document.getElementById('submit').style.backgroundColor = '#398bc5';
    document.getElementById('submit').innerHTML = 'Submit inter-library loan request';
    document.getElementById('story').className = 'collapse';
    document.getElementById('story_div').className = '';
  }

  /*var needs = document.getElementsByClassName('need');
  for ( var n in needs ) {
    if (oab.supportable || oab.requestable || ( oab.library && (typeof needs[n].getAttribute !== 'function' || needs[n].getAttribute('id') === 'iconill') ) ) {
      needs[n].onclick = function(e) {
        var href = e.target.getAttribute('href');
        if (href === undefined || href === null) href = e.target.parentNode.getAttribute('href');
        var type = e.target.getAttribute('data-type');
        if (type === undefined || type === null) type = e.target.parentNode.getAttribute('data-type');
        var supports = e.target.getAttribute('data-support');
        if (supports === undefined || supports === null) supports = e.target.parentNode.getAttribute('data-support');
        var action = e.target.getAttribute('data-action');
        if (action === undefined || action === null) action = e.target.parentNode.getAttribute('data-action');

        if ( href === '#' && api_key ) {
          e.preventDefault();
          var what = type === 'ill' ? 'inter-library loan' : type;
          var ask = action === 'support' ? 'Someone else has started a request for this ' + what + '. Add your support. ' : 'Create a new ' + what + ' request. ';
          if (type === 'ill') what = 'article';
          ask += 'How would getting access to this ' + what + ' help you?';
          if (action !== 'support' && type !== 'ill') ask += ' This message will be sent to the author.';
          document.getElementById('story').setAttribute('placeholder',ask);
          document.getElementById('submit').setAttribute('data-type',type);
          document.getElementById('submit').setAttribute('data-support',supports);
          document.getElementById('submit').setAttribute('data-action',action);
          if ( action === 'support' ) {
            document.getElementById('submit').innerHTML = document.getElementById('submit').innerHTML.replace('create','support');
          } else {
            document.getElementById('submit').innerHTML = document.getElementById('submit').innerHTML.replace('support','create');
          }
          document.getElementById('story_div').className = '';
        } else if (chrome && chrome.tabs && api_key) {
          chrome.tabs.create({'url': href});
        }
      }
    } else {
      needs[n].className = 'need disabled';
      var blurb = needs[n].getAttribute('alt').split('.')[0];
      needs[n].setAttribute('alt',blurb);
      needs[n].setAttribute('title',blurb);
      needs[n].onclick = function(e) {
        var href = e.target.getAttribute('href');
        if (href === undefined || href === null) href = e.target.parentNode.getAttribute('href');
        if (href === '#') e.preventDefault();
      }      
    }
  }*/

  document.getElementById('submit').onclick = function (e) {
    document.getElementById('submit').className = 'collapse';
    document.getElementById('icon_submitting').className = '';
    var data = {
      story: document.getElementById('story').value
    };
    var action = document.getElementById('submit').getAttribute('data-action');
    if (action === 'ill') {
      data.id = document.getElementById('id').value;
      data.title = document.getElementById('title').value;
      if (data.id && data.title) {
        oab.sendILL(api_key, data, handleILLResponse, oab.handleAPIError);
      } else {
        document.getElementById('submit').className = '';
        document.getElementById('icon_submitting').className = 'collapse';
        if (!data.id) document.getElementById('id').setAttribute('placeholder','INSTITUTIONAL EMAIL REQUIRED');
        if (!data.title) document.getElementById('title').setAttribute('placeholder','ARTICLE TITLE REQUIRED');
      }
    } else if ( action === 'create' ) {
      data.type = document.getElementById('submit').getAttribute('data-type');
      data.url = page_url;
      try {
        chrome.storage.local.get({dom : ''}, function(items) {
          if (items.dom !== '') data.dom = items.dom;
          oab.sendRequestPost(api_key, data, handleRequestResponse, oab.handleAPIError);
        });
      } catch (err) {
        oab.sendRequestPost(api_key, data, handleRequestResponse, oab.handleAPIError);
      }
    } else {
      data._id = document.getElementById('submit').getAttribute('data-support');
      oab.sendSupportPost(api_key, data, handleRequestResponse, oab.handleAPIError);
    }
  };

  document.getElementById('story').onkeyup = function () {
    var length = document.getElementById('story').value.replace(/  +/g,' ').split(' ').length;
    var left = 25 - length;
    if (left < 0) {
      left = 0;
    }
    if (length === 0) {
      document.getElementById('submit').innerHTML = 'Say why you need this in up to <br><span id="counter">25</span> words to support this request';
      document.getElementById('submit').style.backgroundColor = '#f04717';
    }
    if (length <= 5) {
      document.getElementById('submit').innerHTML = 'Tell us your reason with up to <span id="counter"></span><br> more words to support this request';
      document.getElementById('submit').style.backgroundColor = '#f04717';
    }
    if ( left < 25 && length > 5 ) {
      document.getElementById('submit').removeAttribute('disabled');
    } else {
      document.getElementById('submit').setAttribute('disabled',true);
    }
    if (length > 5 && length <= 10) {
      document.getElementById('submit').innerHTML = 'Great, <span id="counter"></span> words remaining!<br>Write a few more?';
      document.getElementById('submit').style.backgroundColor = '#ffff66';
    }
    if (length > 10 && length <= 20) {
      document.getElementById('submit').innerHTML = '<span id="counter"></span> words left! Or click to submit<br>now and create your request!';
      document.getElementById('submit').style.backgroundColor = '#99ff99';
    }
    if (length > 20) {
      document.getElementById('submit').innerHTML = '<span id="counter"></span>... Click now to submit your<br>reason and create your request';
      document.getElementById('submit').style.backgroundColor = '#99ff99';
    }
    document.getElementById('counter').innerHTML = left;
  };
};
