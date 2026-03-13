// --- 1. HELPER & GLOBAL STATE ---
const $ = (id) => document.getElementById(id);

let deck = [];
let currentIndex = 0;
let currentUser = 'Guest';
let editMode = false;
let cardToEditIndex = null;

// --- 2. STORAGE & STATS ---
const updateStats = () => {
  const total = $('total-cards');
  if (total) total.innerText = deck.length;
};

const saveToStorage = () => {
  localStorage.setItem(`deck_${currentUser}`, JSON.stringify(deck));
};

// --- 3. CORE LOGIC (CARD MGMT) ---
const addFlashcard = () => {
  const q = $('quest-input').value;
  const a = $('ans-input').value;
  
  if (q && a) {
    if (editMode && cardToEditIndex !== null) {
      deck[cardToEditIndex].question = q;
      deck[cardToEditIndex].answer = a;
      editMode = false;
      cardToEditIndex = null;
      $('add-btn').innerText = 'Add to Deck';
      $('add-btn').style.background = '';
      $('delete-btn').style.display = 'none';
    } else {
      deck.push({ question: q, answer: a, nextReview: 0 });
    }
    saveToStorage();
    updateStats();
    $('quest-input').value = '';
    $('ans-input').value = '';
    shownextDueCard();
  }
};

const deleteCard = () => {
  // Sprawdzamy czy mamy co usuwać
  if (cardToEditIndex === null || cardToEditIndex === undefined) {
      console.error("Error: Show the Card to delete");
      return;
  }

  if (confirm("Are you sure want to Delete this Card?")) {
    // 1. Usuwamy fizycznie z tablicy deck
    deck.splice(cardToEditIndex, 1);
    
    // 2. Czyścimy ślady edycji
    editMode = false;
    cardToEditIndex = null;
    
    // 3. Resetujemy UI (Pola wpisywania)
    $('quest-input').value = '';
    $('ans-input').value = '';
    $('add-btn').innerText = 'Add to Deck';
    $('add-btn').style.background = '';
    $('delete-btn').style.display = 'none';

    // 4. KLUCZOWE: Zapisujemy nową tablicę do pamięci przeglądarki
    saveToStorage();
    
    // 5. Odświeżamy licznik i pokazujemy kolejną kartę
    updateStats();
    shownextDueCard();
    
    console.log("System: Card is disintegrated.");
  }
};


const startEdit = () => {
  const currentCard = deck[currentIndex];
  if (currentCard) {
    $('quest-input').value = currentCard.question;
    $('ans-input').value = currentCard.answer;
    editMode = true;
    cardToEditIndex = currentIndex;
    $('add-btn').innerText = "Replace Error";
    $('add-btn').style.background = "#d73a49";
    $('delete-btn').style.display = 'flex';
    $('quest-input').focus();
    window.scrollTo(0, 0);
  }
};

// --- 4. REVIEW LOGIC (POSTPONE) ---
const postpone = (days) => {
  const msInDay = 24 * 60 * 60 * 1000;
  deck[currentIndex].nextReview = Date.now() + (days * msInDay);
  saveToStorage();
  updateStats();
  shownextDueCard();
};

const rateCard = (level) => {
  if (level === 'hard') postpone(1);
  if (level === 'good') postpone(3);
  if (level === 'easy') postpone(7);
};

// --- 5. UI RENDERING ---
const showAnswer = () => {
  $('answer-text').style.display = 'block'; 
  $('show-answer').style.display = 'none'; 
  $('repetition-controls').style.display = 'flex'; 
};

const renderCard = () => {
  const currentCard = deck[currentIndex];
  if (!currentCard) {
    $('question-text').innerText = "All clear... Rest, Spark...";
    $('answer-text').style.display = 'none';
    $('repetition-controls').style.display = "none";
    $('show-answer').style.display = 'none';
    return;
  }

  $('question-text').innerHTML = `${currentCard.question} <br> <small style="font-size:0.6rem; color:var(--neon-blue); cursor:pointer;">[TAP TO EDIT]</small>`;
  $('question-text').onclick = startEdit;
  $('answer-text').innerText = currentCard.answer;
  $('answer-text').style.display = 'none';
  $('repetition-controls').style.display = 'none';
  $('show-answer').style.display = 'block';
  $('delete-btn').style.display = 'none';
};

const shownextDueCard = () => {
  const now = Date.now();
  const dueCards = deck.filter(card => !card.nextReview || card.nextReview <= now);
  if (dueCards.length > 0) {
    currentIndex = deck.indexOf(dueCards[0]);
    renderCard();
  } else {
    renderCard();
  }
};

// --- 6. SYNC & ARCHIVE ---
const syncSystem = () => {
  const name = $('user-input').value.trim();
  if (name) {
    currentUser = name;
    $('display-name').innerText = currentUser;
    deck = JSON.parse(localStorage.getItem(`deck_${currentUser}`)) || [];
    $('user-input').value = '';
    $('quest-input').focus();
    updateStats();
    shownextDueCard();
  } else { alert('Identify yourself, Pilot'); }
};

const exportDeck = () => {
  if (deck.length === 0) return alert("Empty!");
  const dataStr = JSON.stringify(deck, null, 2);
  const dataBlob = new Blob([dataStr], {type:'application/json'});
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `deck_${currentUser}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

const importDeck = (event) =>{
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      deck = JSON.parse(e.target.result);
      saveToStorage(); updateStats(); shownextDueCard();
      alert("Success!");
    } catch (err){ alert("Error!"); }
  };
  reader.readAsText(file);
};

// --- 7. INITIALIZATION (THE SPARK) ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Podstawowe systemy
  $('login-btn').onclick = syncSystem;
  $('add-btn').onclick = addFlashcard;
  $('show-answer').onclick = showAnswer;

  // 2. KOSZ - KLUCZOWA POPRAWKA
  const trashBtn = $('delete-btn');
  if (trashBtn) {
    trashBtn.onclick = (e) => {
      e.stopPropagation(); // Zatrzymuje sygnał, żeby nie kliknąć w kartę pod spodem
      deleteCard();
    };
  }
  
  // 3. Oceny (Postpone)
  const h = $('hard-btn'); if(h) h.onclick = () => rateCard('hard');
  const g = $('good-btn'); if(g) g.onclick = () => rateCard('good');
  const e = $('easy-btn'); if(e) e.onclick = () => rateCard('easy');
  const o = $('omega-btn'); if(o) o.onclick = () => postpone(30);

  // 4. Narzędzia systemowe
  $('export-btn').onclick = exportDeck;
  $('import-btn').onclick = () => $('import-input').click(); 
  $('import-input').onchange = importDeck;

  // Rozruch
  updateStats();
  shownextDueCard();
  console.log('Anki ARV 1.1: System Ready. Trash disposal active.');
});
