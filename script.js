const myheader = document.querySelector("header");
const loadingDiv = document.querySelector("#loading-icon");
const slots = document.querySelectorAll(".scoreboard-letter");

const APIgetword = "https://words.dev-apis.com/word-of-the-day";
const randomWord = "?random=1";
const APIvalidate = "https://words.dev-apis.com/validate-word";

const wordlength = 5;
const numofwords = 6;
const slotQty = wordlength * numofwords;

let theWord = "";
let keycounter = 0;
let arrayshift = 0;
let currentRow = 0;
let lastKeyWasBackspace = false;
let greenSlotCounter = 0;

function isValidKey(key) {
    if (key === "Enter") return true;
    else if (key === "Backspace") return true;
    else return /^[a-zA-Z]$/.test(key);
}
function render(key) {
    slots[keycounter].innerText = key.toLowerCase();
}
function clearSlots (){
    slots.forEach((slot) => {
        slot.innerText = "";
        slot.style.backgroundColor = "white";
    });
    keycounter = 0;
    arrayshift = 0;
    currentRow = 0;
    greenSlotCounter = 0;
    lastKeyWasBackspace = false;
}
function contentRowWord(){
    let myWord = "";
    for (let i = currentRow*wordlength; i < keycounter; i++){
        myWord = myWord + slots[i].textContent;
    }
    return myWord.toLowerCase();
}
function errorAnimationStarter(){
    for (let i = currentRow*wordlength; i < keycounter; i++) {
        slots[i].classList.add('change-border-color');
        slots[i].style.animationName = "none";
        requestAnimationFrame(() => {
            setTimeout(() => {
                slots[i].style.animationName = "";
            }, 0);
        });
    }
}
function winnerAnimationStarter() {
    for (let i = 0; i < wordlength; i++){
        slots[i+((currentRow-1)*5)].style.color = "white";
    }
    myheader.children[0].classList.add('celebrate');
}

function getTheWordCharQty(){
    const the_Word = Array.from(theWord);
    const counts = {};
    the_Word.forEach(function (x) { counts[x] = (counts[x] || 0) + 1; });
    return counts;
}
function depurateYellows (greens, yellows){
    const all = []
    all.push(...greens, ...yellows);
    const counter = getTheWordCharQty();

    const uniqueIds = [];
    const depurated = all.filter(element => {
        const isDuplicate = uniqueIds.includes(element.letter);

        if (!isDuplicate || counter[element.letter] > 0) { 
          uniqueIds.push(element.letter);
          counter[element.letter] = counter[element.letter] - 1; //To not depurate duplicated greens
          return true;
        }
        return false;
      });
    return depurated;
}
function paintSlots(greens, yellows) {
    //paint everything gray beforehand
    for (let i = 0; i < wordlength; i++){
        slots[i+(currentRow*5)].style.backgroundColor = "#888";
    }
    //paint with depurated data
    let depurated = depurateYellows(greens, yellows);
    depurated.forEach(aSlotData => {
        slots[aSlotData.position].style.backgroundColor = aSlotData.color;
    });
}

function compareWords(myWord) {
    let slotPosition;
    //theWord = "boule"; //extra case: ooep - bloom(user)
    let greens = [];
    let yellows = [];
    greenSlotCounter = 0;
    
    let thech = Array.from(theWord);
    Array.from(myWord).forEach( (mych, i) => {
        slotPosition = currentRow * wordlength;
        slotPosition += i;
        for (let j = 0; j < wordlength; j++) {
            if (mych === thech[j]) {
                if (i == j) {
                    greens.push(
                        {
                        letter: slots[slotPosition].innerText.toLowerCase(),
                        position: slotPosition,
                        color: "darkgreen"
                        }
                    );
                    greenSlotCounter++;
                }
                else {
                    yellows.push(
                        {
                        letter: slots[slotPosition].innerText.toLowerCase(),
                        position: slotPosition,
                        color: "goldenrod"
                        }
                    );
                }
                break;
            }
        }
    });
    paintSlots(greens, yellows);
}

async function validateWord(){
    showLoading(true);
    const rowWord = contentRowWord();
    const promise = await fetch (APIvalidate, {
        method: "POST",
        body: JSON.stringify({
            "word": rowWord
        })
    });
    const { validWord } = await promise.json();
    showLoading(false);
    if (validWord) {
        compareWords(rowWord);
        keycounter+=1;
        arrayshift=1;
        currentRow+=1;
    }
    else {
        errorAnimationStarter();
    }
}
function gameNotYetWon(){
    return (greenSlotCounter < wordlength);
}
function processKey(key) {
    if (isValidKey(key) && gameNotYetWon()) {
        if ( !(key === "Backspace") && (!lastKeyWasBackspace) 
        && keycounter != 0 && ( keycounter % wordlength ) == 0) {
            if (key === "Enter") {
                validateWord().then(() => {
                    if (greenSlotCounter >= wordlength) {
                        winnerAnimationStarter();
                        alert("You Win!");
                    }
                });
                if (keycounter >= slotQty) {
                    if (greenSlotCounter < wordlength) {
                        alert(`You lose, the word was: ${theWord.toUpperCase()}`);
                        // sleep(2000).then(() => { console.log('World!'); });
                    }
                    showLoading(true);
                    getWord(APIgetword+randomWord).then(() => { 
                        clearSlots();
                        showLoading(false);
                    });
                }
            }
        }
        else if (key.length == 1) {
            keycounter = keycounter - arrayshift;
            render(key);
            keycounter = (keycounter >= slotQty) ? 0 : keycounter+=1;
            arrayshift = 0
            lastKeyWasBackspace = false;
        }
        else if (key === "Backspace") {
            if (keycounter >= (currentRow*wordlength)+1) {
                if (parseInt(keycounter / wordlength) >= currentRow) {
                    keycounter-=1;
                    render("");
                }
                lastKeyWasBackspace = true;
            }
        }
    }
    else return;
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
function showLoading(value) {
    console.log(value);
    loadingDiv.classList.toggle('hidden', !value); //bool value is the optional force parameter. When false removes the token(the class in this case), which means will not be hidden
}
async function getWord (URL) {
    const promise = await fetch(URL);
    const processedResponse = await promise.json();
    theWord = processedResponse.word;
    // This can be done in a more direct way by using "destructuring assignment", for ex:
    //{ word } = await promise.json(); //needs to have the same property name
}
function init () {
    showLoading(true);
    //Load word API
    getWord(APIgetword+randomWord).then(()=>{
        showLoading(false);
    });
    //Key event handler
    document
        .addEventListener("keydown", (e) => {
            processKey(e.key);
        });
}

init();