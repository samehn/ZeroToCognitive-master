// Watson dialog
var textStrings = new Array();
textStrings[0] = "Hi, my name is Watson. What's your name?";
textStrings[1] = "Hi {0}, How can I help you today?";
textStrings[3] = "What would you like to classify?";
textStrings[4] = "{0}, Your client is most likely in the {1} industry. Would you like to see the rest of the industries?";
var isFirst = true;
var dialog_target = ""; var iter = 0;

function startDialog(_target)
{
  NLC_Button.hide();
  dialog_target = $(_target);
  dialog_target.empty();
  if (getCookieValue("name") != "") {iter++; nextStep();}
  else { talkToMe(dialog_target, textStrings[iter]); }
//  if (getCookieValue("name") != "") {document.cookie = "name=";}
}

// talk to me ... use the existing text to speech service to talk to the user
function talkToMe (_target, _string)
{
  _target.append('<div class="shape bubble2"><p>'+_string+'</p></div>');
// but hide the audio controller
  speak(_string, a_player_target, false);
}
// create the visual space for the text bubble
function listenToMe(_iter)
{
    chat = 'chat_'+iter;
    dialog_target.append('<div class="shape bubble1"><p id="'+chat+'">...</p></div>');
    stt_out = $("#"+chat);
    listen("#"+chat);
}
// figure out the next step in the conversation.
function nextStep()
{
switch (iter) {
  case 0:  // start of a dialog, don't have person's name
    listenToMe(iter);
    iter++;
    break;
  case 1: // have person's name, need to remember it
    // because we're going to allow this program to loop, check to see if we need to clear the dialog and hide the classify button
    if(!isFirst) {NLC_Button.hide(); dialog_target.empty();}
    else {
      // get Name and save it as a cookie
      if (getCookieValue("name") == "")
      { document.cookie = "name="+trimStrip($("#chat_"+(iter-1))[0].innerText); }
      isFirst=false;
      }
    talkToMe(dialog_target, textStrings[iter].format(getCookieValue("name")));
    iter++;
    break;
  case 2: // request classification
    listenToMe(iter);
    iter++;
    break;
  case 3: // check if classification requested. if not, return to "how can I help you"
    // check to see if text == classify or classified
    // if so, set up for classification, else reset iter and call nextStep().
    var str = trimStrip($("#chat_"+(iter-1))[0].innerText).toLowerCase();
    if((str=="classify") || (str=="classified") || (str=="classifier"))
      { talkToMe(dialog_target, textStrings[iter]); iter++; }
      else { iter=1; nextStep(); }
    break;
  case 4: // classification requested. enable button, listen
    msg_out = textStrings[iter];
    NLC_Button.show();
    listenToMe(iter);
    iter++;
    break;
  case 5: // stop button clicked after classification requested. initiate classification process.
    iter++;
    var nlcPage = "displayNLC.html";
    toggle_mic(_mic, _stop, false)
    getIndustryClassification(stt_out, msg_out);
    NLC_Button.hide();
    break;
  case 6: // would you like to see the rest of the results?
    listenToMe(iter);
    iter++;
    break;
  case 7: // listen for positive response.
    var str = trimStrip($("#chat_"+(iter-1))[0].innerText).toLowerCase();
    if((str=="yes") || (str=="yup") || (str=="yeah"))
      { iter=1; setModal(industryPage, displayNLC, industryTable, nlc_classes); }
      else { iter=1; nextStep(); }
    break;

  default: // iter has a value less than zero or greater than 7
    break;
  }
}
