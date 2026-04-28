const STORAGE_KEY = 'BOOKSHELF_APP_DATA';

const bookForm = document.getElementById('bookForm');
const titleInput = document.getElementById('bookFormTitle');
const authorInput = document.getElementById('bookFormAuthor');
const yearInput = document.getElementById('bookFormYear');
const isCompleteInput = document.getElementById('bookFormIsComplete');
const submitButton = document.getElementById('bookFormSubmit');
const cancelEditButton = document.getElementById('bookFormCancel');
const bookFormHeading = document.getElementById('bookFormHeading');
const searchForm = document.getElementById('searchBook');
const searchInput = document.getElementById('searchBookTitle');
const incompleteBookList = document.getElementById('incompleteBookList');
const completeBookList = document.getElementById('completeBookList');
const incompleteEmptyMessage = document.getElementById('incompleteEmptyMessage');
const completeEmptyMessage = document.getElementById('completeEmptyMessage');

let books = [];
let searchQuery = '';
let editingBookId = null;

function isStorageAvailable() {
    try {
        const testKey = '__storage_test__';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
        return true;
    } catch (_error) {
        return false;
    }
}

function saveBooks() {
    if (!isStorageAvailable()) {
        return;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
}

function loadBooks() {
    if (!isStorageAvailable()) {
        books = [];
        return;
    }

    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
        books = [];
        return;
    }

    try {
        const parsedBooks = JSON.parse(rawData);
        books = Array.isArray(parsedBooks)
            ? parsedBooks.map((book) => ({
                id: String(book.id ?? `${Date.now()}`),
                title: String(book.title ?? ''),
                author: String(book.author ?? ''),
                year: Number(book.year) || 0,
                isComplete: Boolean(book.isComplete),
            }))
            : [];
    } catch (_error) {
        books = [];
    }
}

function resetForm() {
    bookForm.reset();
    yearInput.setCustomValidity('');
    editingBookId = null;
    updateSubmitButtonLabel();
}

function updateSubmitButtonLabel() {
    const targetRackLabel = isCompleteInput.checked ? 'Selesai dibaca' : 'Belum selesai dibaca';

    if (editingBookId === null) {
        submitButton.innerHTML = `Masukkan Buku ke rak <span>${targetRackLabel}</span>`;
        cancelEditButton.hidden = true;
        bookFormHeading.textContent = 'Tambah Buku Baru';
        return;
    }

    submitButton.innerHTML = `Simpan Perubahan ke rak <span>${targetRackLabel}</span>`;
    cancelEditButton.hidden = false;
    bookFormHeading.textContent = 'Edit Buku';
}

function createBookElement(book, staggerIndex) {
    const bookItem = document.createElement('div');
    bookItem.setAttribute('data-bookid', String(book.id));
    bookItem.setAttribute('data-testid', 'bookItem');
    bookItem.style.setProperty('--stagger-index', String(staggerIndex));

    const titleEl = document.createElement('h3');
    titleEl.setAttribute('data-testid', 'bookItemTitle');
    titleEl.textContent = book.title;

    const authorEl = document.createElement('p');
    authorEl.setAttribute('data-testid', 'bookItemAuthor');
    authorEl.textContent = `Penulis: ${book.author}`;

    const yearEl = document.createElement('p');
    yearEl.setAttribute('data-testid', 'bookItemYear');
    yearEl.textContent = `Tahun: ${book.year}`;

    const actionContainer = document.createElement('div');

    const toggleButton = document.createElement('button');
    toggleButton.type = 'button';
    toggleButton.setAttribute('data-testid', 'bookItemIsCompleteButton');
    toggleButton.textContent = book.isComplete ? 'Belum selesai dibaca' : 'Selesai dibaca';

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.setAttribute('data-testid', 'bookItemDeleteButton');
    deleteButton.textContent = 'Hapus buku';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.setAttribute('data-testid', 'bookItemEditButton');
    editButton.textContent = 'Edit buku';

    actionContainer.append(toggleButton, deleteButton, editButton);
    bookItem.append(titleEl, authorEl, yearEl, actionContainer);

    return bookItem;
}

function renderBooks() {
    incompleteBookList.innerHTML = '';
    completeBookList.innerHTML = '';

    const normalizedSearchQuery = searchQuery.trim().toLowerCase();

    const filteredBooks = books
        .filter((book) => book.title.toLowerCase().includes(normalizedSearchQuery))
        .sort((firstBook, secondBook) => {
            const yearGap = secondBook.year - firstBook.year;
            if (yearGap !== 0) {
                return yearGap;
            }

            return String(secondBook.id).localeCompare(String(firstBook.id));
        });

    let incompleteIndex = 0;
    let completeIndex = 0;

    filteredBooks.forEach((book) => {
        const bookElement = createBookElement(
            book,
            book.isComplete ? completeIndex : incompleteIndex
        );

        if (book.isComplete) {
            completeIndex += 1;
            completeBookList.appendChild(bookElement);
            return;
        }

        incompleteIndex += 1;
        incompleteBookList.appendChild(bookElement);
    });

    const emptyMessage = normalizedSearchQuery
        ? 'Tidak ada buku yang sesuai pencarian.'
        : 'Belum ada buku pada rak ini.';
    incompleteEmptyMessage.textContent = emptyMessage;
    completeEmptyMessage.textContent = emptyMessage;
    incompleteEmptyMessage.hidden = incompleteIndex > 0;
    completeEmptyMessage.hidden = completeIndex > 0;
}

function generateBookId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function addBook({ title, author, year, isComplete }) {
    const newBook = {
        id: generateBookId(),
        title,
        author,
        year,
        isComplete,
    };

    books.push(newBook);
}

function parseYear(value) {
    const parsedYear = Number.parseInt(value, 10);
    if (!Number.isInteger(parsedYear) || parsedYear <= 0) {
        return null;
    }

    return parsedYear;
}

function syncYearValidity() {
    if (yearInput.value.trim() === '') {
        yearInput.setCustomValidity('');
        return;
    }

    const parsedYear = parseYear(yearInput.value);
    if (parsedYear === null) {
        yearInput.setCustomValidity('Tahun harus angka lebih dari 0.');
        return;
    }

    yearInput.setCustomValidity('');
}

function updateBook(bookId, payload) {
    books = books.map((book) => {
        if (book.id !== bookId) {
            return book;
        }

        return {
            ...book,
            ...payload,
        };
    });
}

function findBookById(bookId) {
    return books.find((book) => book.id === bookId);
}

function deleteBook(bookId) {
    books = books.filter((book) => book.id !== bookId);

    if (editingBookId === bookId) {
        resetForm();
    }
}

function toggleBookCompleteStatus(bookId) {
    const selectedBook = findBookById(bookId);
    if (!selectedBook) {
        return;
    }

    updateBook(bookId, { isComplete: !selectedBook.isComplete });

    if (editingBookId === bookId) {
        isCompleteInput.checked = !selectedBook.isComplete;
        updateSubmitButtonLabel();
    }
}

function startEditBook(bookId) {
    const selectedBook = findBookById(bookId);
    if (!selectedBook) {
        return;
    }

    editingBookId = bookId;
    titleInput.value = selectedBook.title;
    authorInput.value = selectedBook.author;
    yearInput.value = String(selectedBook.year);
    isCompleteInput.checked = selectedBook.isComplete;
    updateSubmitButtonLabel();
    titleInput.focus();
}

function shouldDeleteBook(bookId) {
    const selectedBook = findBookById(bookId);
    if (!selectedBook) {
        return false;
    }

    return window.confirm(`Hapus buku "${selectedBook.title}"?`);
}

function getBookIdFromElement(targetElement) {
    const parentBookItem = targetElement.closest('[data-testid="bookItem"]');
    if (!parentBookItem) {
        return null;
    }

    const bookId = parentBookItem.getAttribute('data-bookid');
    if (!bookId) {
        return null;
    }

    return bookId;
}

function handleBookActionClick(event) {
    const clickedButton = event.target.closest('button[data-testid]');
    if (!clickedButton) {
        return;
    }

    const testId = clickedButton.getAttribute('data-testid');
    const bookId = getBookIdFromElement(clickedButton);

    if (bookId === null) {
        return;
    }

    if (testId === 'bookItemEditButton') {
        startEditBook(bookId);
        return;
    }

    let hasChanges = false;

    if (testId === 'bookItemIsCompleteButton') {
        toggleBookCompleteStatus(bookId);
        hasChanges = true;
    }

    if (testId === 'bookItemDeleteButton') {
        if (!shouldDeleteBook(bookId)) {
            return;
        }

        deleteBook(bookId);
        hasChanges = true;
    }

    if (!hasChanges) {
        return;
    }

    saveBooks();
    renderBooks();
}

bookForm.addEventListener('submit', (event) => {
    event.preventDefault();

    syncYearValidity();
    if (!bookForm.reportValidity()) {
        return;
    }

    const title = titleInput.value.trim();
    const author = authorInput.value.trim();
    const year = parseYear(yearInput.value);
    const isComplete = isCompleteInput.checked;

    if (!title || !author || year === null) {
        return;
    }

    if (editingBookId === null) {
        addBook({ title, author, year, isComplete });
    } else {
        updateBook(editingBookId, { title, author, year, isComplete });
    }

    saveBooks();
    renderBooks();
    resetForm();
});

searchForm.addEventListener('submit', (event) => {
    event.preventDefault();
    searchQuery = searchInput.value.trim();
    renderBooks();
});

cancelEditButton.addEventListener('click', resetForm);
yearInput.addEventListener('input', syncYearValidity);
isCompleteInput.addEventListener('change', updateSubmitButtonLabel);
searchInput.addEventListener('input', () => {
    searchQuery = searchInput.value.trim();
    renderBooks();
});
incompleteBookList.addEventListener('click', handleBookActionClick);
completeBookList.addEventListener('click', handleBookActionClick);

loadBooks();
updateSubmitButtonLabel();
renderBooks();
