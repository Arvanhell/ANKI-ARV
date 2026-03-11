// 1. Helper
const $ = (id) => document.getElementById(id);

// Counter 
const updateStats =() => {
  const total = $('total-cards');
  if (total) total.innerText = deck.length;
};

// 2. Global State
let deck = [];
let currentIndex = 0;
let currentUser = 'Guest';

// 3. User & Storage Logic
const syncSystem = () => {
  const nameInput = $('user-input');
  const name = nameInput.value.trim();
  
  if (name) {
    currentUser = name;
    $('display-name').innerText = currentUser;
    
    // Loading database
    deck = JSON.parse(localStorage.getItem(`deck_${currentUser}`)) || [];
    // UI auto
    nameInput.value = '';     //Cleaning login input
    $('quest-input').focus(); // Focus on next field
    
    updateStats();            // Refreshing counter
    shownextDueCard();            // Starting next card
  } else {
    alert('Identify yourself, Pilot');
  }
};

const saveToStorage = () => {
  localStorage.setItem(`deck_${currentUser}`, JSON.stringify(deck));
};

//---------------------------------
// EXPORT 
// 1. Export Swapping deck into file .json
const exportDeck = () => {
  if (deck.length === 0) return alert("Deck is empty!");
  // Creating new data to transfer
  const dataStr = JSON.stringify(deck, null, 2);
  const dataBlob = new Blob([dataStr], {type:'application/json'});
  const url = URL.createObjectURL(dataBlob);
  
  // Creating temporarily adress to download
  const link = document.createElement('a');
  link.href = url;
  link.download = `deck_${currentUser}_${new Date().toISOString().slice(0,10)}.json`;

  link.click();
  
  // cleaning
  URL.revokeObjectURL(url);
};

// 2. IMPORT : Reading data and importing to database
const importDeck = (event) =>{
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (Array.isArray(importedData)) {
        deck = importedData;
        saveToStorage();
        updateStats();
        shownextDueCard();
        alert("System Restored Successfully!");
      }
    } catch (err){
      alert("Error: Invalid backup file!")
    }
  };
  reader.readAsText(file);
}

//---------------------------------


// 4. Card Managment
const addFlashcard = () => {
  const q = $('quest-input').value;
  const a = $('ans-input').value;
  
  if ( q && a ) {
    deck.push( {
      question: q,
      answer: a,
      nextReview: 0
    });
    saveToStorage();
    updateStats();
    $('quest-input').value = '';
    $('ans-input').value = '';
  }
};

const shownextDueCard = () => {
  const now = Date.now();
  const dueCards = deck.filter(card => !card.nextReview || card.nextReview <= now);
  
  if (dueCards.length > 0) {
    currentIndex = deck.indexOf(dueCards[0]);
    renderCard();
} else {
  $('question-text').innerText = "All clear. Rest, Spark.";
  $('answer-text').style.display = 'none';
  $('repetition-controls').style.display = "none";
  }
};

const renderCard  = () => {
  const currentCard = deck[currentIndex];
  $('question-text').innerText = currentCard.question;
  $('answer-text').innerText = currentCard.answer;
  $('answer-text').style.display = 'none';
  $('repetition-controls').style.display = 'none';
};

const postpone = (days) => {
  const msInDay = 24 * 60 * 60 * 1000;
  deck[currentIndex].nextReview = Date.now() + (days * msInDay);
  saveToStorage();
  shownextDueCard();
};

const toggleAnswer = () => {
  const ans = $('answer-text');
  const isHidden = ans.style.display === 'none';
  ans.style.display = isHidden ? 'block' : 'none';
  $('repetition-controls').style.display = isHidden ? 'block' : 'none';
};

// 5. Events

$('login-btn').onclick = syncSystem;
$('add-btn').onclick = addFlashcard;
$('show-answer').onclick = toggleAnswer;

//

$('export-btn').onclick = exportDeck;
$('import-btn').onclick = () => $('import-input').click(); // Window for picking the file
$('import-input').onchange = importDeck;








 
 