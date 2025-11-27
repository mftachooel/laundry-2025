const studentData = {
    '7': ['Ahmad', 'Budi', 'Chandra'],
    '8': ['Bagus', 'Arul', 'Tri'],
    '9': ['Faishol', 'Hadi', 'Indra'],
    '10RPL': ['Citra', 'Jaka', 'Kania'],
    '10TKJ': ['Lia', 'Mega', 'Nina'],
    '11RPL': ['sumar', 'nanang', 'yanto'],
    '11TKJ': ['Oscar', 'Putra', 'Rian']
};

let laundryBatches = JSON.parse(localStorage.getItem('laundryBatches')) || [];
let currentCart = JSON.parse(localStorage.getItem('currentCart')) || [];

function formatDate(dateString) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function saveData() {
    localStorage.setItem('laundryBatches', JSON.stringify(laundryBatches));
    updateUI();
}

function saveCart() {
    localStorage.setItem('currentCart', JSON.stringify(currentCart));
}

document.getElementById('studentClass').addEventListener('change', function() {
    const selectedClass = this.value;
    const studentNameSelect = document.getElementById('studentName');
    const names = studentData[selectedClass] || [];
    
    console.log('Kelas dipilih:', selectedClass);
    console.log('Nama siswa tersedia:', names);
    
    studentNameSelect.innerHTML = ''; 
    
    if (names.length === 0) {
        studentNameSelect.innerHTML = '<option value="" selected>Tidak ada siswa</option>';
        studentNameSelect.disabled = true;
    } else {
        studentNameSelect.innerHTML = '<option value="" disabled selected>Pilih Nama Siswa</option>';
        names.forEach(name => {
            const option = document.createElement('option');
            option.value = name;
            option.textContent = name;
            studentNameSelect.appendChild(option);
        });
        studentNameSelect.disabled = false;
    }
});

document.getElementById('addItemToCartBtn').addEventListener('click', function() {
    const itemType = document.getElementById('itemType').value;
    const itemQuantity = parseInt(document.getElementById('itemQuantity').value);
    const itemDescription = document.getElementById('itemDescription').value.trim();

    if (!itemType || itemQuantity < 1) {
        alert('Silakan pilih jenis pakaian dan jumlah yang valid.');
        return;
    }

    const existingItemIndex = currentCart.findIndex(item => 
        item.itemType === itemType && item.itemDescription === itemDescription
    );

    if (existingItemIndex > -1) {
        currentCart[existingItemIndex].itemQuantity += itemQuantity;
    } else {
        currentCart.push({ itemType, itemQuantity, itemDescription });
    }

    saveCart(); 
    updateCartUI(); 
    
    document.getElementById('itemType').value = '';
    document.getElementById('itemQuantity').value = 1;
    document.getElementById('itemDescription').value = '';
});

function updateCartUI() {
    const laundryCartList = document.getElementById('laundryCartList');
    const submitCartBtn = document.getElementById('submitCartBtn');
    
    laundryCartList.innerHTML = ''; 
    if (currentCart.length === 0) {
        laundryCartList.innerHTML = '<li class="list-group-item text-muted text-center">Keranjang masih kosong</li>';
        submitCartBtn.disabled = true; 
        return;
    }

    currentCart.forEach((item, index) => {
        const itemElement = document.createElement('li');
        itemElement.className = 'list-group-item d-flex justify-content-between align-items-center cart-item';
        itemElement.innerHTML = `
            <div class="flex-grow-1 me-3">
                <strong>${item.itemType}</strong>
                ${item.itemDescription ? `<br><small class="text-muted">${item.itemDescription}</small>` : ''}
            </div>
            <div class="d-flex align-items-center">
                <button type="button" class="btn btn-outline-secondary cart-qty-btn" data-index="${index}" data-action="minus">
                    <i class="bi bi-dash"></i>
                </button>
                <span class="cart-qty-display mx-2">${item.itemQuantity}</span>
                <button type="button" class="btn btn-outline-secondary cart-qty-btn" data-index="${index}" data-action="plus">
                    <i class="bi bi-plus"></i>
                </button>
                <button type="button" class="btn btn-sm btn-outline-danger remove-from-cart-btn ms-3" data-index="${index}">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
        laundryCartList.appendChild(itemElement);
    });

    submitCartBtn.disabled = false;
    
    document.querySelectorAll('.remove-from-cart-btn').forEach(button => {
        button.addEventListener('click', function() {
            removeFromCart(parseInt(this.getAttribute('data-index')));
        });
    });
    
    document.querySelectorAll('.cart-qty-btn').forEach(button => {
        button.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            const action = this.getAttribute('data-action');
            updateCartQuantity(index, action);
        });
    });
}

function updateCartQuantity(index, action) {
    if (!currentCart[index]) return; 

    if (action === 'plus') {
        currentCart[index].itemQuantity++;
    } else if (action === 'minus') {
        currentCart[index].itemQuantity--;
        if (currentCart[index].itemQuantity <= 0) {
            removeFromCart(index);
            return;
        }
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(index) {
    currentCart.splice(index, 1); 
    saveCart();
    updateCartUI(); 
}

document.getElementById('submitCartBtn').addEventListener('click', function() {
    const studentName = document.getElementById('studentName').value;
    const studentClass = document.getElementById('studentClass').value;

    if (!studentName || !studentClass) {
        alert('Silakan pilih Kelas dan Nama Siswa terlebih dahulu.');
        return;
    }
    
    const newBatch = {
        batchId: generateId(),
        studentName,
        studentClass,
        dateAdded: new Date().toISOString().split('T')[0],
        status: 'pending',
        dateCompleted: null,
        laundryNotes: null,
        items: [...currentCart] 
    };
    
    laundryBatches.push(newBatch);
    saveData();
    
    document.getElementById('studentClass').value = '';
    document.getElementById('studentName').innerHTML = '<option value="" selected>Pilih Kelas Terlebih Dahulu</option>';
    document.getElementById('studentName').disabled = true;
    
    currentCart = [];
    saveCart(); 
    updateCartUI();
    
    alert('Laundry berhasil diserahkan!');
});

function updateUI() {
    updatePendingItems();
    updateCompletedItems();
    updateStatistics();
    updateRecentItems();
}

function updatePendingItems() {
    const pendingItemsList = document.getElementById('pendingItemsList');
    pendingItemsList.innerHTML = '';
    
    const pendingBatches = laundryBatches.filter(batch => batch.status === 'pending');
    
    if (pendingBatches.length === 0) {
        pendingItemsList.innerHTML = '<div class="list-group-item text-muted text-center">Tidak ada laundry yang belum selesai</div>';
        return;
    }
    
    pendingBatches.forEach(batch => {
        const itemsHtml = batch.items.map(item => 
            `<li><strong>${item.itemType}</strong> (${item.itemQuantity} pcs)${item.itemDescription ? ` - <small class="text-muted">${item.itemDescription}</small>` : ''}</li>`
        ).join('');
        const itemElement = document.createElement('div');
        itemElement.className = 'list-group-item d-flex justify-content-between align-items-start status-pending';
        itemElement.innerHTML = `
            <div class="form-check">
                <input class="form-check-input me-2" type="checkbox" data-id="${batch.batchId}">
                <label class="form-check-label">
                    <strong>${batch.studentName} (${batch.studentClass})</strong>
                    <br><small class="text-muted">Ditambahkan: ${formatDate(batch.dateAdded)}</small>
                    <ul class="batch-item-list">${itemsHtml}</ul>
                </label>
            </div>
        `;
        pendingItemsList.appendChild(itemElement);
    });
    
    document.querySelectorAll('.form-check-input').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            document.getElementById('markCompletedBtn').disabled = 
                document.querySelectorAll('.form-check-input:checked').length === 0;
        });
    });
}

function updateCompletedItems() {
    const completedItemsList = document.getElementById('completedItemsList');
    completedItemsList.innerHTML = '';
    
    const completedBatches = laundryBatches.filter(batch => batch.status === 'completed');
    
    if (completedBatches.length === 0) {
        completedItemsList.innerHTML = '<div class="list-group-item text-muted text-center">Belum ada laundry yang selesai</div>';
        return;
    }
    
    completedBatches.forEach(batch => {
        const itemsHtml = batch.items.map(item => 
            `<li><strong>${item.itemType}</strong> (${item.itemQuantity} pcs)${item.itemDescription ? ` - <small class="text-muted">${item.itemDescription}</small>` : ''}</li>`
        ).join('');
        const itemElement = document.createElement('div');
        itemElement.className = 'list-group-item d-flex justify-content-between align-items-start status-completed';
        itemElement.innerHTML = `
            <div>
                <strong>${batch.studentName} (${batch.studentClass})</strong>
                <br><small class="text-muted">Selesai: ${formatDate(batch.dateCompleted)}</small>
                ${batch.laundryNotes ? `<br><small class="text-muted">Catatan: ${batch.laundryNotes}</small>` : ''}
                <ul class="batch-item-list">${itemsHtml}</ul>
            </div>
            <button class="btn btn-sm btn-outline-danger delete-btn" data-id="${batch.batchId}">
                <i class="bi bi-trash"></i>
            </button>
        `;
        completedItemsList.appendChild(itemElement);
    });
    
    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', function() {
            const batchId = this.getAttribute('data-id');
            if (confirm('Apakah Anda yakin ingin menghapus batch laundry ini?')) {
                laundryBatches = laundryBatches.filter(b => b.batchId !== batchId);
                saveData();
            }
        });
    });
}

function updateStatistics() {
    document.getElementById('totalBatchesCount').textContent = laundryBatches.length;
    document.getElementById('pendingBatchesCount').textContent = laundryBatches.filter(b => b.status === 'pending').length;
    document.getElementById('completedBatchesCount').textContent = laundryBatches.filter(b => b.status === 'completed').length;
}


function updateRecentItems() {
    const recentPendingList = document.getElementById('recentPendingList');
    const recentCompletedList = document.getElementById('recentCompletedList');
    
    recentPendingList.innerHTML = '';
    recentCompletedList.innerHTML = '';
    
    const recentPending = laundryBatches
        .filter(b => b.status === 'pending')
        .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
        .slice(0, 5);
    
    const recentCompleted = laundryBatches
        .filter(b => b.status === 'completed')
        .sort((a, b) => new Date(b.dateCompleted) - new Date(a.dateCompleted))
        .slice(0, 5);
    
    if (recentPending.length === 0) {
        recentPendingList.innerHTML = '<div class="list-group-item text-muted text-center">Tidak ada laundry yang belum selesai</div>';
    } else {
        recentPending.forEach(batch => {
            const itemElement = document.createElement('div');
            itemElement.className = 'list-group-item status-pending';
            itemElement.innerHTML = `
                <strong>${batch.studentName} (${batch.studentClass})</strong>
                <br><small class="text-muted">${formatDate(batch.dateAdded)}</small>
                <br><small>${batch.items.length} jenis pakaian</small>
            `;
            recentPendingList.appendChild(itemElement);
        });
    }
    
    if (recentCompleted.length === 0) {
        recentCompletedList.innerHTML = '<div class="list-group-item text-muted text-center">Belum ada laundry yang selesai</div>';
    } else {
        recentCompleted.forEach(batch => {
            const itemElement = document.createElement('div');
            itemElement.className = 'list-group-item status-completed';
            itemElement.innerHTML = `
                <strong>${batch.studentName} (${batch.studentClass})</strong>
                <br><small class="text-muted">${formatDate(batch.dateCompleted)}</small>
                <br><small>${batch.items.length} jenis pakaian</small>
            `;
            recentCompletedList.appendChild(itemElement);
        });
    }
}

document.getElementById('markCompletedBtn').addEventListener('click', function() {
    if (document.querySelectorAll('.form-check-input:checked').length === 0) return;
    const modal = new bootstrap.Modal(document.getElementById('confirmationModal'));
    modal.show();
});

document.getElementById('confirmMarkCompleted').addEventListener('click', function() {
    const checkboxes = document.querySelectorAll('.form-check-input:checked');
    const laundryDate = document.getElementById('laundryDate').value || new Date().toISOString().split('T')[0];
    const laundryNotes = document.getElementById('laundryNotes').value;
    
    checkboxes.forEach(checkbox => {
        const batchId = checkbox.getAttribute('data-id');
        const batchIndex = laundryBatches.findIndex(b => b.batchId === batchId);
        if (batchIndex !== -1) {
            laundryBatches[batchIndex].status = 'completed';
            laundryBatches[batchIndex].dateCompleted = laundryDate;
            laundryBatches[batchIndex].laundryNotes = laundryNotes;
        }
    });
    
    saveData();
    
    document.getElementById('laundryDate').value = '';
    document.getElementById('laundryNotes').value = '';
    document.getElementById('markCompletedBtn').disabled = true;
    
    const modal = bootstrap.Modal.getInstance(document.getElementById('confirmationModal'));
    modal.hide();
    
    alert('Laundry berhasil ditandai selesai!');
});

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing app...');
    document.getElementById('laundryDate').value = new Date().toISOString().split('T')[0];
    updateUI();
    updateCartUI(); 
    console.log('App initialized successfully');
});