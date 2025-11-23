// --- Supabase 連携設定 (デモ/プレースホルダー) ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // 実際のURLに置き換えてください
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // 実際のキーに置き換えてください

// データベース連携をシミュレートするインメモリデータ
const memberData = [
    { id: 1, name: '山田 太郎', initial: '山', type: 'company', dept: '開発部', role: 'PM', color: 'orange-600', is_admin: true, email: 'yamada.taro@example.com', phone: '090-XXXX-XXXX', furigana: 'ヤマダ タロウ', avatarUrl: 'https://placehold.co/80x80/ff991a/ffffff?text=PM' },
    { id: 2, name: '田中 次郎', initial: '田', type: 'company', dept: '開発部', role: 'FE', color: 'blue-600', is_admin: false, email: 'tanaka.jiro@example.com', phone: '', furigana: 'タナカ ジロウ' },
    { id: 3, name: '山本 翼', initial: '山', type: 'company', dept: '開発部', role: 'BE', color: 'green-600', is_admin: false, email: 'yamamoto.tsubasa@example.com', phone: '080-YYYY-YYYY', furigana: 'ヤマモト ツバサ' },
    { id: 4, name: '佐藤 華', initial: '佐', type: 'friends', dept: '外部', role: 'デザイナー', color: 'purple-600', is_admin: false, email: 'sato.hana@freelance.com', phone: '', furigana: 'サトウ ハナ' },
    { id: 5, name: '鈴木 一郎', initial: '鈴', type: 'company', dept: '営業部', role: '営業', color: 'red-600', is_admin: false, email: 'suzuki.ichiro@example.com', phone: '', furigana: 'スズキ イチロウ' },
    { id: 6, name: '小林 愛', initial: '小', type: 'friends', dept: '外部', role: 'フリーランス', color: 'teal-600', is_admin: false, email: 'kobayashi.ai@gmail.com', phone: '', furigana: 'コバヤシ アイ' },
];

let currentUserId = 1; // デモ用: ログイン中のユーザーID (ID 1: 山田太郎を管理者とする)
let currentUser = memberData.find(m => m.id === currentUserId);

let currentStepIndex = null; 
let selectedMembers = {}; 
let selectedInviteMembers = [1, 3, 4]; 
let currentSection = 'task'; 
let currentJumpTaskId = null;
let currentJumpTargetStep = null;
let editingStaffId = null; 

// --- ユーティリティ/UI機能 ---

/**
 * 簡易メッセージボックスを表示し、数秒後に非表示にする
 * @param {string} message - 表示するメッセージ
 */
function showTemporaryMessage(message) {
    const box = document.getElementById('message-box');
    if (!box) return;

    box.textContent = message;
    box.classList.remove('hidden');
    // アニメーション用に opacity-100 を設定
    setTimeout(() => {
        box.classList.remove('opacity-0');
        box.classList.add('opacity-100');
    }, 10); 

    // 3秒後に非表示
    setTimeout(() => {
        box.classList.remove('opacity-100');
        box.classList.add('opacity-0');
        setTimeout(() => {
            box.classList.add('hidden');
        }, 300); // アニメーション完了後に hidden
    }, 3000);
}


function getProgressColor(percent) {
    let className = '';
    let textColor = '';
    if (percent >= 90) {
        className = 'progress-91-100'; 
        textColor = 'text-red-600';
    } else if (percent >= 61) {
        className = 'progress-61-90'; 
        textColor = 'text-yellow-600';
    } else if (percent >= 31) {
        className = 'progress-31-60'; 
        textColor = 'text-green-600';
    } else {
        className = 'progress-0-30'; 
        textColor = 'text-blue-600';
    }
    return { className, textColor };
}

function updateProgressBars() {
    document.querySelectorAll('.task-card').forEach(card => {
        const percent = parseInt(card.dataset.progress);
        const { className, textColor } = getProgressColor(percent);
        
        const progressBar = card.querySelector('.progress-bar');
        const progressPercent = card.querySelector('.progress-percent');

        // クラスをリセットしてから適用
        progressBar.className = progressBar.className.split(' ').filter(c => !c.startsWith('progress-')).join(' ');
        progressBar.classList.add(className);
        progressBar.style.width = `${percent}%`;

        // テキストカラーの適用
        progressPercent.className = progressPercent.className.split(' ').filter(c => !c.startsWith('text-')).join(' ');
        progressPercent.classList.add(textColor);
    });
}

// --- ナビゲーション & タブ切り替えロジック ---

function updateFabAction(sectionId) {
    const fab = document.querySelector('.fab');
    if (!fab) return;

    if (sectionId === 'task') {
        fab.classList.remove('hidden');
        fab.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>';
        fab.setAttribute('onclick', 'openCreateTask()');
    } else if (sectionId === 'members') {
        fab.classList.remove('hidden');
        fab.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>';
        fab.setAttribute('onclick', 'openAddMemberModal()');
    } else {
        fab.classList.add('hidden');
        fab.setAttribute('onclick', '');
    }
}

function hideAllSections() {
    document.querySelectorAll('#auth-section, #company-registration-section, #task-list-section, #board-list-section, #member-list-section, #board-detail-section, #create-task-section, #profile-section, #admin-staff-list-section').forEach(section => {
        section.classList.add('hidden');
    });
}

function showAuthSection(mode) {
     hideAllSections();
     document.getElementById('auth-section').classList.remove('hidden');
     setAuthMode(mode);
}

function showSection(sectionId) {
    if (sectionId === 'company-registration') {
        hideAllSections();
        document.getElementById('company-registration-section').classList.remove('hidden');
        return;
    }

    currentSection = sectionId;

    // メインアプリ内の全セクションを非表示
    hideAllSections();
    document.getElementById('main-app-content').classList.remove('hidden');

    // 指定されたセクションを表示
    if (sectionId === 'task') {
        document.getElementById('task-list-section').classList.remove('hidden');
    } else if (sectionId === 'boardlist') {
        document.getElementById('board-list-section').classList.remove('hidden');
    } else if (sectionId === 'members') {
        document.getElementById('member-list-section').classList.remove('hidden');
    } else if (sectionId === 'profile') {
        document.getElementById('profile-section').classList.remove('hidden');
        loadProfileData(); 
    } else if (sectionId === 'admin-staff-list') {
        if (!currentUser || !currentUser.is_admin) {
             showTemporaryMessage('アクセスが拒否されました。管理者権限が必要です。');
             showSection('profile'); 
             return;
        }
        document.getElementById('admin-staff-list-section').classList.remove('hidden');
        renderStaffList();
    }


    // タブボタンの切り替え処理
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('primary-border', 'primary-text');
        button.classList.add('border-transparent', 'text-gray-500', 'hover:border-gray-300');
    });

    const targetButtonText = (sectionId === 'task') ? 'タスクリスト' : (sectionId === 'boardlist' ? '掲示板リスト' : (sectionId === 'members' ? 'メンバー' : 'プロフィール'));
    const activeButton = Array.from(document.querySelectorAll('.tab-button')).find(btn => btn.textContent.trim() === targetButtonText);
    
    if (activeButton) {
        activeButton.classList.add('primary-border', 'primary-text');
        activeButton.classList.remove('border-transparent', 'text-gray-500', 'hover:border-gray-300');
    }
    
    // FABアクションの更新
    updateFabAction(sectionId);
}

let currentAuthMode = 'login';
function setAuthMode(mode) {
    currentAuthMode = mode;
    
    document.querySelectorAll('.auth-tab').forEach(button => {
        button.classList.remove('primary-border', 'primary-text');
        button.classList.add('border-transparent', 'text-gray-500', 'hover:border-gray-300');
    });

    const activeTabButton = document.querySelector(`.auth-tab[onclick*="${mode}"]`);
    if (activeTabButton) {
        activeTabButton.classList.add('primary-border', 'primary-text');
        activeTabButton.classList.remove('border-transparent', 'text-gray-500', 'hover:border-gray-300');
    }
    
    // ログイン/サインアップのフォーム切り替え
    if (mode === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
    }
}

// 新規登録時の必須項目チェックと登録シミュレーション
async function validateAndRegister() {
    const name = document.getElementById('signup-name').value.trim();
    const furigana = document.getElementById('signup-furigana').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const password = document.getElementById('signup-password').value.trim();

    if (!name || !furigana || !password) {
        showTemporaryMessage('氏名、フリガナ、パスワードは必須項目です。');
        return;
    }

    if (!email && !phone) {
        showTemporaryMessage('メールアドレスまたは電話番号のどちらか一方が必須です。');
        return;
    }

    // 実際のSupabaseサインアップ処理をシミュレート
    showTemporaryMessage('ユーザー登録を試行中...');
    await new Promise(resolve => setTimeout(resolve, 500)); // 非同期処理をシミュレート

    // 成功をシミュレート
    simulateLogin();
}

async function simulateLogin() {
    // 実際のSupabase認証ロジックが入ります

    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('main-app-content').classList.remove('hidden');
    document.getElementById('app').classList.remove('max-w-4xl'); 
    document.getElementById('app').classList.remove('shadow-xl');
    
    let fabButton = document.querySelector('.fab');
    if (!fabButton) {
        fabButton = document.createElement('button');
        fabButton.className = 'fab primary-button text-white material-card-shadow';
        document.body.appendChild(fabButton);
    }
    
    showSection('task'); 
    updateProgressBars(); 
    showTemporaryMessage(`ログイン成功。ようこそ、${currentUser.name}さん！`);
}

async function registerCompany() {
    const companyName = document.getElementById('company-name').value.trim();
    const companyId = document.getElementById('company-id').value.trim();
    const departments = document.getElementById('initial-departments').value.trim();

    if (!companyName || !companyId) {
        showTemporaryMessage('会社名と会社IDは必須です。');
        return;
    }

    // 実際のSupabaseへの会社登録と管理者権限付与処理をシミュレート
    showTemporaryMessage('会社登録と管理者設定を処理中...');
    await new Promise(resolve => setTimeout(resolve, 500)); 

    showTemporaryMessage(`会社名: ${companyName} で登録しました。\n管理者としてメインアプリへ移動します。`);
    
    // 会社登録後の遷移をシミュレート
    simulateLogin();
}

// --- プロフィール関連ロジック ---

function loadProfileData() {
    if (!currentUser) return;

    // アバター表示
    const avatarDisplay = document.getElementById('profile-avatar-display');
    if (avatarDisplay) { 
        if (currentUser.avatarUrl) {
            avatarDisplay.innerHTML = `<img src="${currentUser.avatarUrl}" alt="Avatar" class="profile-avatar">`;
        } else {
             avatarDisplay.innerHTML = `<div class="profile-avatar bg-${currentUser.color.split('-')[0]}-400 text-white flex items-center justify-center text-3xl font-bold">${currentUser.initial}</div>`;
        }
    }

    // プロフィール入力フィールドに現在のユーザーデータをセット
    document.getElementById('profile-name').value = currentUser.name || '';
    document.getElementById('profile-furigana').value = currentUser.furigana || ''; 
    document.getElementById('profile-dept').value = currentUser.dept || '';
    document.getElementById('profile-email').value = currentUser.email || '';
    document.getElementById('profile-phone').value = currentUser.phone || '';
    document.getElementById('profile-password').value = ''; 

    // 管理者リンクの表示/非表示を制御
    const adminLinkContainer = document.getElementById('admin-link-container');
    if (adminLinkContainer) { 
        if (currentUser.is_admin) {
            adminLinkContainer.classList.remove('hidden');
        } else {
            adminLinkContainer.classList.add('hidden');
        }
    }
}

function changeAvatar() {
    showTemporaryMessage('トップ画像変更機能をシミュレートします。');
}

async function updateProfile() {
    const name = document.getElementById('profile-name').value.trim();
    const furigana = document.getElementById('profile-furigana').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    const phone = document.getElementById('profile-phone').value.trim();
    const dept = document.getElementById('profile-dept').value.trim();
    const password = document.getElementById('profile-password').value.trim();

    if (!name || !furigana) {
        showTemporaryMessage('氏名、フリガナは必須です。');
        return;
    }
    if (!email && !phone) {
        showTemporaryMessage('メールアドレスまたは電話番号のどちらか一方が必須です。');
        return;
    }

    showTemporaryMessage('プロフィール情報を更新中...');
    await new Promise(resolve => setTimeout(resolve, 300)); 

    // データ更新のシミュレーション
    currentUser.name = name;
    currentUser.furigana = furigana; 
    currentUser.email = email;
    currentUser.phone = phone;
    currentUser.dept = dept;
    if (password) {
        showTemporaryMessage('パスワードも更新されました。（デモ）');
    }

    showTemporaryMessage('プロフィール情報が正常に更新されました。');
    document.getElementById('profile-password').value = ''; 
    loadProfileData(); 
}

// --- 管理者スタッフ一覧ロジック ---

// Supabaseからのスタッフ一覧取得をシミュレート
async function fetchStaffs() {
    // 実際のSupabase連携コードが入ります
    await new Promise(resolve => setTimeout(resolve, 100)); // 遅延をシミュレート
    return memberData;
}

async function renderStaffList() {
    const tableBody = document.getElementById('staff-table-body');
    const staffs = await fetchStaffs(); // データを取得
    
    document.getElementById('staff-count').textContent = staffs.length;
    
    tableBody.innerHTML = staffs.map(member => `
        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                <div class="flex items-center">
                     <div class="w-8 h-8 bg-${member.color.split('-')[0]}-200 dark:bg-${member.color} rounded-full flex items-center justify-center font-bold text-${member.color.split('-')[0]}-800 dark:text-white mr-3 text-xs">${member.initial}</div>
                    ${member.name}
                </div>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                ${member.dept || '-'} / ${member.role || '-'}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-center">
                ${member.is_admin ? '<span class="bg-red-100 text-red-800 text-xs font-semibold px-2 py-0.5 rounded-full dark:bg-red-900 dark:text-red-300">管理者</span>' : '-'}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button onclick="openStaffEditModal(${member.id})" class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">編集</button>
                <button onclick="deleteStaff(${member.id}, '${member.name}')" class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">削除</button>
            </td>
        </tr>
    `).join('');
}

function openStaffEditModal(id) {
    editingStaffId = id;
    const modalTitle = document.getElementById('staff-edit-title');
    const staff = memberData.find(m => m.id === id);
    
    const editAvatarDisplay = document.getElementById('edit-avatar-display');
    const passwordLabel = document.getElementById('edit-password-label');
    const passwordNote = document.getElementById('edit-password-note');


    if (id === 'new') {
        modalTitle.textContent = '新規スタッフを追加';
        document.getElementById('edit-name').value = '';
        document.getElementById('edit-furigana').value = '';
        document.getElementById('edit-email').value = '';
        document.getElementById('edit-phone').value = '';
        document.getElementById('edit-dept').value = '';
        document.getElementById('edit-is-admin').checked = false;
        document.getElementById('edit-password').value = '';

        // 新規作成時はパスワード必須の表示に切り替え
        passwordLabel.textContent = 'パスワード (必須)';
        passwordNote.textContent = '※ 新規作成時は必須、編集時は空欄の場合は変更されません。';
        editAvatarDisplay.innerHTML = `<div class="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center text-3xl font-bold">?</div>`;

    } else if (staff) {
        modalTitle.textContent = `${staff.name} の情報を編集`;
        document.getElementById('edit-name').value = staff.name;
        document.getElementById('edit-furigana').value = staff.furigana || '';
        document.getElementById('edit-email').value = staff.email;
        document.getElementById('edit-phone').value = staff.phone;
        document.getElementById('edit-dept').value = staff.dept;
        document.getElementById('edit-is-admin').checked = staff.is_admin;
        document.getElementById('edit-password').value = '';

        // 編集時はパスワード任意入力の表示に切り替え
        passwordLabel.textContent = 'パスワード (変更しない場合は空欄)';
        passwordNote.textContent = '※ 空欄の場合は、現在のパスワードは変更されません。';
        
        // アバター表示
        if (staff.avatarUrl) {
            editAvatarDisplay.innerHTML = `<img src="${staff.avatarUrl}" alt="Avatar" class="profile-avatar">`;
        } else {
            editAvatarDisplay.innerHTML = `<div class="profile-avatar bg-${staff.color.split('-')[0]}-400 text-white flex items-center justify-center text-3xl font-bold">${staff.initial}</div>`;
        }
    } else {
        return;
    }

    document.getElementById('staff-edit-modal').classList.remove('hidden');
}

function closeStaffEditModal() {
    document.getElementById('staff-edit-modal').classList.add('hidden');
    editingStaffId = null;
}

async function saveStaff() {
    const name = document.getElementById('edit-name').value.trim();
    const furigana = document.getElementById('edit-furigana').value.trim();
    const email = document.getElementById('edit-email').value.trim();
    const phone = document.getElementById('edit-phone').value.trim();
    const dept = document.getElementById('edit-dept').value.trim();
    const password = document.getElementById('edit-password').value.trim();
    const isAdmin = document.getElementById('edit-is-admin').checked;

    if (!name || !furigana) {
        showTemporaryMessage('氏名、フリガナは必須です。');
        return;
    }

    showTemporaryMessage('スタッフ情報を保存中...');
    await new Promise(resolve => setTimeout(resolve, 300)); 


    if (editingStaffId === 'new') {
        if (!password) {
             showTemporaryMessage('新規スタッフ登録時はパスワードが必須です。');
             return;
        }
        // 新規追加のロジックをシミュレート
        const newId = memberData.length + 1;
        memberData.push({
            id: newId,
            name: name,
            initial: name[0],
            type: 'company',
            dept: dept,
            role: 'スタッフ',
            color: 'pink-600', 
            is_admin: isAdmin,
            email: email,
            phone: phone,
            furigana: furigana,
        });
        showTemporaryMessage(`${name} を新規スタッフとして追加しました。`);
    } else {
        // 編集のロジックをシミュレート
        const index = memberData.findIndex(m => m.id === editingStaffId);
        if (index !== -1) {
            memberData[index].name = name;
            memberData[index].furigana = furigana;
            memberData[index].email = email;
            memberData[index].phone = phone;
            memberData[index].dept = dept;
            memberData[index].is_admin = isAdmin;
            
            if (password) {
                showTemporaryMessage('パスワードも更新されました。（デモ）');
            }
            showTemporaryMessage(`${name} の情報を更新しました。`);
        }
    }

    closeStaffEditModal();
    renderStaffList();
}

function deleteStaff(id, name) {
    if (id === currentUserId) {
        showTemporaryMessage('現在ログイン中のユーザーは削除できません。');
        return;
    }
    
    // 実際のカスタムモーダルではなく、シンプルな確認をシミュレート
    if (window.confirm(`${name}さんをスタッフリストから削除しますか？`)) { 
        const index = memberData.findIndex(m => m.id === id);
        if (index !== -1) {
            memberData.splice(index, 1);
            showTemporaryMessage(`${name}さんを削除しました。`);
            renderStaffList();
        }
    }
}

function openCsvImportModal() {
    document.getElementById('csv-import-modal').classList.remove('hidden');
}

function closeCsvImportModal() {
    document.getElementById('csv-import-modal').classList.add('hidden');
}

// --- その他UIロジック (タスク/フロー/メンバー) ---

function toggleCompletedTasks() {
    const list = document.getElementById('completed-tasks-list');
    const icon = document.getElementById('completed-toggle-icon');

    if (list.classList.contains('hidden')) {
        list.classList.remove('hidden');
        icon.classList.add('rotate-180');
    } else {
        list.classList.add('hidden');
        icon.classList.remove('rotate-180');
    }
}

function toggleFlowDetail(taskId) {
    const detailElement = document.getElementById(`flow-detail-${taskId}`);
    
    if (detailElement.classList.contains('hidden')) {
        document.querySelectorAll('.task-card > .border-t').forEach(el => el.classList.add('hidden')); 
        detailElement.classList.remove('hidden');
    } else {
        detailElement.classList.add('hidden');
    }
}

function navigateToBoard(taskId) {
    let title = '';
    if (taskId === 1) {
        title = '新機能開発プロジェクト';
    } else if (taskId === 2) {
        title = '次期サービス マーケティング戦略';
    } else {
        return;
    }
    openBoardDetail(taskId, title, 'ongoing');
}

function handleTaskAction(taskId, action) {
    if (action === 'done') {
        showTemporaryMessage(`タスクID ${taskId} を完了し、次の担当者へ自動でハンドオフ（パス）します。`);
    }
}

function filterTasks(filterValue) {
    showTemporaryMessage(`タスクを「${filterValue}」で絞り込みます。（実際のタスクは変更されていません）`);
}

function markAsRead(boardId) {
    const newMarker = document.getElementById(`board-new-${boardId}`);
    if (newMarker && !newMarker.classList.contains('hidden')) {
        newMarker.classList.add('hidden');
    }
}

function openBoardDetail(boardId, title, status) {
    document.getElementById('task-list-section').classList.add('hidden');
    document.getElementById('board-list-section').classList.add('hidden');
    document.getElementById('member-list-section').classList.add('hidden'); 
    document.querySelector('.fab')?.classList.add('hidden');
    
    document.getElementById('board-detail-section').classList.remove('hidden');
    document.getElementById('board-detail-section').dataset.boardId = boardId;

    document.getElementById('board-detail-title').textContent = title;
    
    markAsRead(boardId);
    
    document.querySelector('.flex.border-b.sticky').classList.add('hidden');
}

function closeBoardDetail() {
    document.getElementById('board-detail-section').classList.add('hidden');
    document.querySelector('.fab')?.classList.remove('hidden');

    document.querySelector('.flex.border-b.sticky').classList.remove('hidden');
    
    showSection('boardlist');
}

function openJumpConfirmationModal(taskId, stepNumber, stepName) {
    currentJumpTaskId = taskId;
    currentJumpTargetStep = stepNumber;
    
    document.querySelector('#jump-modal h3').textContent = `フロー・ジャンプ (スキップ)`;
    document.getElementById('jump-target-display').innerHTML = 
        `現在のタスクを完了し、フローを<span class="primary-text font-bold">ステップ ${stepNumber}: ${stepName}</span>までスキップします。`;

    document.getElementById('jump-modal').classList.remove('hidden');
}

function closeJumpModal() {
    document.getElementById('jump-modal').classList.add('hidden');
    document.getElementById('jump-reason').value = ''; 
    currentJumpTaskId = null;
    currentJumpTargetStep = null;
}

function confirmJump() {
    const reason = document.getElementById('jump-reason').value.trim();

    if (!currentJumpTargetStep) {
        showTemporaryMessage('ジャンプ先のステップが設定されていません。');
        return;
    }
    if (!reason) {
        showTemporaryMessage('スキップする理由の入力は必須です。');
        return;
    }

    showTemporaryMessage(`タスクID ${currentJumpTaskId} のタスクを完了し、フロー ${currentJumpTargetStep} へジャンプを実行します。`);
    closeJumpModal();
}

// Service Worker登録後の初回処理
document.addEventListener('DOMContentLoaded', () => {
    // 招待メンバーの初期表示 (デモ)
    const selectedData = selectedInviteMembers.map(id => memberData.find(m => m.id === id)).filter(m => m);
    const displayArea = document.getElementById('invited-members-display');
    
    if (displayArea) {
        if (selectedData.length === 0) {
            displayArea.innerHTML = '<p class="text-xs text-gray-500">招待メンバーがいません</p>';
        } else {
            displayArea.innerHTML = selectedData.map(m => 
                `<div class="member-avatar bg-${m.color.split('-')[0]}-400 text-white">${m.initial}</div>`
            ).join('');
        }
    }
});

// 以下、タスク作成/メンバー選択に関するロジック（省略されていた部分）

function openCreateTask() {
    // ... タスク作成画面を開くロジック ...
}
function closeCreateTask() {
    // ... タスク作成画面を閉じるロジック ...
}
function openTemplateNameModal() {
    // ... テンプレート名モーダルを開くロジック ...
}
function openTemplateSearchModal() {
    // ... テンプレート検索モーダルを開くロジック ...
}
function openInviteMembersModal() {
    // ... 招待メンバーモーダルを開くロジック ...
}
function openAddMemberModal() {
    // ... メンバー追加モーダルを開くロジック ...
}
function openSelectMemberModal(stepIndex) {
    // ... メンバー選択モーダルを開くロジック ...
}
function toggleMemberSelection(memberId, isChecked) {
    // ... メンバー選択のトグルロジック ...
}
function applySelectedMembers() {
    // ... メンバー選択の適用ロジック ...
}
function saveTemplate() {
    // ... テンプレート保存ロジック ...
}
function createTask() {
    // ... タスク作成ロジック ...
}
function addStep() {
    // ... ステップ追加ロジック ...
}
function updateStepNumbers() {
    // ... ステップ番号更新ロジック ...
}
function selectTemplate(templateName) {
    // ... テンプレート選択ロジック ...
}
function closeTemplateSearchModal() {
    // ... テンプレート検索モーダルを閉じるロジック ...
}
function closeTemplateNameModal() {
    // ... テンプレート名モーダルを閉じるロジック ...
}
function closeAddMemberModal() {
    // ... メンバー追加モーダルを閉じるロジック ...
}
function renderMemberModal(filterType, searchTerm, mode, deptFilter) {
    // ... メンバーリストのレンダリングロジック ...
}