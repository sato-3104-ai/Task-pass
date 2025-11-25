// --- Supabase 連携設定 (本番用プレースホルダー) ---
// 🚨 注意: 実際に利用する際には、以下の値を必ずお客様のSupabase情報に置き換えてください。
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; 
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; 

// --- 本番用初期データ (全て空/NULLで初期化) ---
// 🚨 注意: ログイン後、これらの変数はSupabaseから取得したリアルなデータで上書きされることを想定しています。
const memberData = []; 
let currentUserId = null; 
let currentUser = null; // ログインユーザーは初期状態ではNULL
let selectedInviteMembers = []; 

let currentStepIndex = null; 
let selectedMembers = {}; 
let currentSection = 'task'; 
let currentJumpTaskId = null;
let currentJumpTargetStep = null;
let editingStaffId = null; 

// --- ユーティリティ/UI機能 ---

/**
 * 簡易メッセージボックスを表示し、数秒後に非表示にする
 * (デモ用 alert() の代わり)
 * @param {string} message - 表示するメッセージ
 */
function showTemporaryMessage(message) {
    const box = document.getElementById('message-box');
    if (!box) return;

    box.textContent = message;
    box.classList.remove('hidden');
    setTimeout(() => {
        box.classList.remove('opacity-0');
        box.classList.add('opacity-100');
    }, 10); 

    setTimeout(() => {
        box.classList.remove('opacity-100');
        box.classList.add('opacity-0');
        setTimeout(() => {
            box.classList.add('hidden');
        }, 300); 
    }, 3000);
}

// 実際のアプリではDBから動的に取得するため、以下のデータ関連の関数は、すべて空の処理または仮の成功処理に置き換えます。

function getProgressColor(percent) {
    // スタイルCSSに依存するが、JSロジックとしてはデモのまま残す
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
    // 実際のタスクデータを元に更新するロジックが必要（現在はHTMLのダミーデータ）
    document.querySelectorAll('.task-card').forEach(card => {
        const percent = parseInt(card.dataset.progress);
        const { className, textColor } = getProgressColor(percent);
        const progressBar = card.querySelector('.progress-bar');
        const progressPercent = card.querySelector('.progress-percent');
        // ... (省略)
    });
}


// --- 認証/画面遷移ロジック ---

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
    // ... (画面遷移ロジック - 変更なし) ...
    if (sectionId === 'company-registration') {
        hideAllSections();
        document.getElementById('company-registration-section').classList.remove('hidden');
        return;
    }

    currentSection = sectionId;
    hideAllSections();
    document.getElementById('main-app-content').classList.remove('hidden');

    if (sectionId === 'task') {
        document.getElementById('task-list-section').classList.remove('hidden');
        // 🚨 本番: ここでSupabaseからタスクリストを取得・レンダリングする
    } else if (sectionId === 'boardlist') {
        document.getElementById('board-list-section').classList.remove('hidden');
        // 🚨 本番: ここでSupabaseから掲示板リストを取得・レンダリングする
    } else if (sectionId === 'members') {
        document.getElementById('member-list-section').classList.remove('hidden');
        // 🚨 本番: ここでSupabaseから全メンバーリストを取得・レンダリングする
    } else if (sectionId === 'profile') {
        document.getElementById('profile-section').classList.remove('hidden');
        loadProfileData(); 
    } else if (sectionId === 'admin-staff-list') {
        // 🚨 本番: 管理者権限チェックをSupabase AuthやDBデータで行う
        // if (!currentUser || !currentUser.is_admin) {
        //      showTemporaryMessage('アクセスが拒否されました。管理者権限が必要です。');
        //      showSection('profile'); 
        //      return;
        // }
        document.getElementById('admin-staff-list-section').classList.remove('hidden');
        renderStaffList();
    }
    // ... (タブのハイライトとFABの更新) ...
    
    // タブボタンの切り替え処理 (変更なし)
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
    
    updateFabAction(sectionId);
}

function setAuthMode(mode) {
    // ... (認証タブ切り替えロジック - 変更なし) ...
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
    
    if (mode === 'login') {
        document.getElementById('login-form').classList.remove('hidden');
        document.getElementById('signup-form').classList.add('hidden');
    } else {
        document.getElementById('login-form').classList.add('hidden');
        document.getElementById('signup-form').classList.remove('hidden');
    }
}

// ユーザー認証処理 (Supabase Authに置き換える必要があります)
async function validateAndRegister() {
    // 🚨 本番: ここをSupabase Auth.signUp({ email, password })に置き換える
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

    showTemporaryMessage('ユーザー登録を試行中... (Supabase Auth.signUp)');
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    showTemporaryMessage('Supabase Auth.signUp は成功しましたが、初期データがないためログインできませんでした。');
}

async function simulateLogin() {
    // 🚨 本番: ここをSupabase Auth.signInWithPassword({ email, password })に置き換える
    showTemporaryMessage('ログイン処理を試行中... (Supabase Auth.signInWithPassword)');
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    // 仮の失敗処理: 本番データがないため、ログイン後の画面は表示できない
    showTemporaryMessage('ログインに失敗しました。（本番データがないため）');
}

async function registerCompany() {
    // 🚨 本番: ここをSupabaseへの会社情報登録と管理者ユーザー作成に置き換える
    showTemporaryMessage('会社登録と管理者設定を処理中... (Supabase INSERT)');
    await new Promise(resolve => setTimeout(resolve, 1000)); 

    showTemporaryMessage('会社登録処理に成功しましたが、初期データがないためログインできませんでした。');
}

// --- プロフィール関連ロジック ---

function loadProfileData() {
    // 🚨 本番: Supabaseからログインユーザーのプロフィールを取得し、フォームに設定する
    if (!currentUser) {
        document.getElementById('profile-name').value = '';
        document.getElementById('admin-tools-block').classList.add('hidden');
        return;
    }
    // ... (データロード処理はcurrentUserがNULLのため機能しない) ...
}

async function updateProfile() {
    // 🚨 本番: Supabaseのテーブルデータを更新し, Auth.updateUser()を実行する
    if (!currentUser) return showTemporaryMessage('ユーザーデータがありません。');

    showTemporaryMessage('プロフィール情報を更新中... (Supabase UPDATE)');
    await new Promise(resolve => setTimeout(resolve, 300)); 
    showTemporaryMessage('Supabaseへのプロフィール更新をシミュレートしました。');
}

function changeAvatar() {
    showTemporaryMessage('アバター画像をSupabase Storageにアップロードする処理が必要です。');
}


// --- 管理者スタッフ一覧ロジック ---

// Supabaseからのスタッフ一覧取得をシミュレート
async function fetchStaffs() {
    // 🚨 本番: Supabaseのテーブルからスタッフ一覧を取得する
    showTemporaryMessage('Supabaseからスタッフ一覧データを取得中...');
    await new Promise(resolve => setTimeout(resolve, 500)); 
    return []; // データがないため空の配列を返す
}

async function renderStaffList() {
    const tableBody = document.getElementById('staff-table-body');
    const staffs = await fetchStaffs(); 
    
    document.getElementById('staff-count').textContent = staffs.length;
    
    if (staffs.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-500 dark:text-gray-400">登録スタッフが見つかりません。</td></tr>`;
    } else {
        // 🚨 本番: 取得したデータをもとにテーブルを描画する
        tableBody.innerHTML = ''; 
    }
}

function openStaffEditModal(id) {
    editingStaffId = id;
    const isNew = id === null;
    document.getElementById('staff-modal-title').textContent = isNew ? '新規スタッフの追加' : 'スタッフ情報の編集';
    
    if (!isNew) {
         // 🚨 本番: idをもとにSupabaseからスタッフ情報を取得し、モーダルに設定する
        showTemporaryMessage(`スタッフID ${id} の編集データをロードする処理が必要です。`);
    } else {
        // 新規作成時はフィールドをクリア
        document.getElementById('staff-name').value = '';
        document.getElementById('staff-furigana').value = '';
        document.getElementById('staff-email').value = '';
        document.getElementById('staff-phone').value = '';
        document.getElementById('staff-dept').value = '';
        document.getElementById('staff-role').value = 'member';
        document.getElementById('staff-password').value = ''; 
    }
    
    document.getElementById('staff-edit-modal').classList.remove('hidden');
}

function closeStaffEditModal() {
    document.getElementById('staff-edit-modal').classList.add('hidden');
    editingStaffId = null;
}

async function saveStaff() {
    // 🚨 本番: Supabaseのテーブルに対してINSERT/UPDATEを実行する
    const name = document.getElementById('staff-name').value.trim();
    const email = document.getElementById('staff-email').value.trim();
    const password = document.getElementById('staff-password').value;
    
    if (!name || !email) {
        showTemporaryMessage('氏名とメールアドレスは必須です。');
        return;
    }
    
    if (editingStaffId === null && !password) {
        showTemporaryMessage('新規スタッフの場合、パスワードは必須です。');
        return;
    }

    showTemporaryMessage('スタッフ情報をSupabaseに保存中...');
    await new Promise(resolve => setTimeout(resolve, 500)); 
    showTemporaryMessage('スタッフ情報の保存をシミュレートしました。');
    closeStaffEditModal();
    renderStaffList();
}

function deleteStaff(id, name) {
    // 🚨 本番: Supabaseのテーブルに対してDELETEを実行する
    if (id === currentUserId) {
        showTemporaryMessage('現在ログイン中のユーザーは削除できません。');
        return;
    }
    
    if (confirm(`${name}さんをスタッフリストから削除しますか？`)) { 
        showTemporaryMessage(`スタッフID ${id} の削除をSupabaseで実行します。`);
        // 実際のDELETE処理...
        renderStaffList();
    }
}

function openCsvImportModal() {
    document.getElementById('csv-import-modal').classList.remove('hidden');
}

function closeCsvImportModal() {
    document.getElementById('csv-import-modal').classList.add('hidden');
}

// --- その他のUIロジック (フロー/タスクなど) ---

function toggleCompletedTasks() {
    // ... (変更なし) ...
}
function toggleFlowDetail(taskId) {
    // ... (変更なし) ...
}
function navigateToBoard(taskId) {
    // ... (変更なし) ...
}
function handleTaskAction(taskId, action) {
    // ... (変更なし) ...
}
function filterTasks(filterValue) {
    // ... (変更なし) ...
}
function markAsRead(boardId) {
    // ... (変更なし) ...
}
function openBoardDetail(boardId, title, status) {
    // ... (変更なし) ...
}
function closeBoardDetail() {
    // ... (変更なし) ...
}
function openJumpConfirmationModal(taskId, stepNumber, stepName) {
    // ... (変更なし) ...
}
function closeJumpModal() {
    // ... (変更なし) ...
}
function confirmJump() {
    // ... (変更なし) ...
}

// PWA Service Worker登録後の初回処理
document.addEventListener('DOMContentLoaded', () => {
    // 🚨 本番: ここではデモデータの処理は実行せず、Supabase認証後のデータロードを待機する
    
    // デモ用の空の招待メンバー表示を初期化
    const displayArea = document.getElementById('invited-members-display');
    if (displayArea) {
        displayArea.innerHTML = '<p class="text-xs text-gray-500">招待メンバーがいません</p>';
    }

    // PWA Service Workerの登録
    if ('serviceWorker' in navigator) {
        // 🚨 修正: 登録パスを相対パスに修正
        // Service Workerはルートパスから登録される必要があり、GitHub Pagesでは手前にリポジトリ名が必要です。
        const swUrl = './sw.js'; // index.htmlからの相対パス
        navigator.serviceWorker.register(swUrl)
            .then(reg => console.log('Service Worker registered.', reg))
            .catch(err => console.error('Service Worker registration failed:', err));
    }
    
    // 初期画面表示
    showAuthSection('login'); 
});

// 以下、タスク作成/メンバー選択に関するロジック（未実装部分 - 継続開発が必要です）
function updateFabAction(sectionId) {
    const fab = document.querySelector('.fab');
    if (!fab) return;

    if (sectionId === 'task') {
        fab.classList.remove('hidden');
        fab.innerHTML = '<svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>';
        fab.setAttribute('onclick', 'openCreateTask()');
    } else if (sectionId === 'members' || sectionId === 'profile' || sectionId === 'admin-staff-list') {
        fab.classList.add('hidden'); // これらの画面ではFABは非表示（または別の機能）
    } else {
        fab.classList.add('hidden');
    }
}
function openCreateTask() { showTemporaryMessage('タスク作成機能は未実装です。'); }
function closeCreateTask() { hideAllSections(); showSection('task'); }
function openTemplateNameModal() { showTemporaryMessage('テンプレート保存機能は未実装です。'); }
function openTemplateSearchModal() { showTemporaryMessage('テンプレート検索機能は未実装です。'); }
function openInviteMembersModal() { showTemporaryMessage('招待メンバー選択機能は未実装です。'); }
function openAddMemberModal() { document.getElementById('add-member-modal').classList.remove('hidden'); }
function closeAddMemberModal() { document.getElementById('add-member-modal').classList.add('hidden'); }
function openSelectMemberModal(stepIndex) { showTemporaryMessage('ステップ担当者選択機能は未実装です。'); }
function toggleMemberSelection(memberId, isChecked) { showTemporaryMessage('メンバー選択ロジックは未実装です。'); }
function applySelectedMembers() { closeSelectMemberModal(); showTemporaryMessage('メンバーを適用しましたが、DB操作は行っていません。'); }
function saveTemplate() { showTemporaryMessage('テンプレート保存ロジックは未実装です。'); closeTemplateNameModal(); }
function createTask() { showTemporaryMessage('タスク作成ロジックは未実装です。'); closeCreateTask(); }
function addStep() { showTemporaryMessage('ステップ追加機能は未実装です。'); }
function updateStepNumbers() { /* ナンバリング機能のみ */ }
function selectTemplate(templateName) { showTemporaryMessage(`テンプレート「${templateName}」を適用しました。`); closeTemplateSearchModal(); }
function closeTemplateSearchModal() { document.getElementById('template-search-modal').classList.add('hidden'); }
function closeTemplateNameModal() { document.getElementById('template-name-modal').classList.add('hidden'); }
function closeSelectMemberModal() { document.getElementById('select-member-modal').classList.add('hidden'); }

function renderMemberModal(filterType, searchTerm, mode, deptFilter) { 
    document.getElementById('member-list-container').innerHTML = `<div class="p-4 text-center text-gray-500 dark:text-gray-400">本番モード: メンバーリストのレンダリングは未実装です。</div>`;
}
