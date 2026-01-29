// script.js
// 明日方舟终末地武器基质推荐系统 - 主程序文件

// 全局变量
let weaponData = [];
let locationData = [];
let ruleData = [];
let selectedWeapons = new Set();
let lockedWeapons = new Set();
let recommender = null;
let dataHandler = null;
let currentTheme = 'dark';
let weaponSearchTimeout = null;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 明日方舟终末地武器基质推荐系统启动...');
    
    try {
        // 检查 DataHandler 是否存在
        if (typeof DataHandler === 'undefined') {
            console.error('DataHandler 未定义，尝试从 window.dataHandler 获取');
            
            // 尝试从全局获取 dataHandler
            if (typeof window.dataHandler !== 'undefined') {
                console.log('✅ 从 window.dataHandler 获取到数据处理器');
                dataHandler = window.dataHandler;
            } else {
                throw new Error('DataHandler 未定义，请检查 data-handler.js 是否正确加载');
            }
        } else {
            console.log('✅ DataHandler 类已加载');
            dataHandler = new DataHandler();
        }
        
        // 初始化界面
        initUI();
        
        // 尝试加载数据
        console.log('📥 开始加载数据...');
        try {
            const data = await dataHandler.loadAllData();
            
            weaponData = data.weapons;
            locationData = data.locations;
            ruleData = data.rules;
            
            console.log(`✅ 数据加载完成: ${weaponData.length} 件武器, ${locationData.length} 个地点`);
            
            // 更新界面显示
            updateWeaponCount(weaponData.length);
            updateLocationCount(locationData.length);
            
            // 初始化推荐器
            if (typeof MatrixRecommender !== 'undefined') {
                recommender = new MatrixRecommender(weaponData, locationData, ruleData);
                console.log('✅ 推荐器初始化完成');
            } else {
                console.warn('⚠️ MatrixRecommender 未定义，推荐功能不可用');
            }
            
            // 渲染武器列表
            renderWeaponList();
            
            // 初始化属性搜索选项
            initAttributeSearch();
            
        } catch (dataError) {
            console.error('数据加载失败:', dataError);
            
            // 尝试使用模拟数据
            if (typeof window.mockData !== 'undefined') {
                console.log('尝试使用模拟数据...');
                weaponData = window.mockData.weapons || [];
                locationData = window.mockData.locations || [];
                ruleData = window.mockData.rules || [];
                
                updateWeaponCount(weaponData.length);
                updateLocationCount(locationData.length);
                renderWeaponList();
                initAttributeSearch();
                
                showMessage('使用模拟数据，部分功能可能受限', 'warning');
            } else {
                throw dataError;
            }
        }
        
        // 绑定事件
        bindEvents();
        
        // 更新统计信息
        updateStats();
        
        // 隐藏加载提示
        hideLoadingMessage();
        
        console.log('🎉 系统初始化完成');
        showMessage('系统初始化完成，可以开始使用了！', 'success');
        
    } catch (error) {
        console.error('❌ 系统初始化失败:', error);
        showErrorMessage('系统初始化失败: ' + error.message);
        
        // 尝试显示基本界面，即使数据加载失败
        try {
            initUI();
            bindEvents();
            hideLoadingMessage();
        } catch (uiError) {
            console.error('UI初始化失败:', uiError);
        }
    }
});

// 更新武器数量显示
function updateWeaponCount(count) {
    const weaponCountElement = document.querySelector('.weapon-count');
    if (weaponCountElement) {
        weaponCountElement.textContent = `${count}件武器`;
    }
    
    // 同时更新其他需要显示武器数量的地方
    const totalCount = document.getElementById('total-count');
    if (totalCount) totalCount.textContent = count;
    
    const totalWeaponsElem = document.getElementById('total-weapons');
    if (totalWeaponsElem) totalWeaponsElem.textContent = count;
}

// 更新地点数量显示
function updateLocationCount(count) {
    const locationCountElement = document.querySelector('.location-count');
    if (locationCountElement) {
        locationCountElement.textContent = `${count}个地点`;
    }
    
    // 同时更新其他需要显示地点数量的地方
    const totalLocationsElem = document.getElementById('total-locations');
    if (totalLocationsElem) totalLocationsElem.textContent = count;
}

// 初始化武器列表
function initWeaponList(weapons) {
    const weaponListElement = document.getElementById('weapon-list');
    if (!weaponListElement) return;
    
    // 清空现有内容
    weaponListElement.innerHTML = '';
    
    if (!weapons || weapons.length === 0) {
        weaponListElement.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>暂无武器数据</p>
            </div>
        `;
        return;
    }
    
    // 添加武器项
    weapons.forEach(weapon => {
        const weaponItem = createWeaponListItem(weapon);
        weaponListElement.appendChild(weaponItem);
    });
    
    console.log(`✅ 武器列表初始化完成: ${weapons.length} 件武器`);
}

// 创建武器列表项（简单版本，用于initWeaponList）
function createWeaponListItem(weapon) {
    const div = document.createElement('div');
    div.className = 'weapon-item';
    div.setAttribute('data-weapon', weapon.name);
    
    // 创建简单的武器显示
    div.innerHTML = `
        <div class="weapon-info">
            <span class="weapon-name">${weapon.name}</span>
            <span class="weapon-star">${weapon.star || '未知'}</span>
        </div>
        <div class="weapon-attributes">
            <span class="weapon-type">${weapon.type || '未知'}</span>
            <span class="weapon-base">${weapon.baseAttr || '未知'}</span>
        </div>
    `;
    
    return div;
}

// 隐藏加载提示
function hideLoadingMessage() {
    const loadingElement = document.querySelector('.loading-message');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
    
    // 也隐藏我们的加载覆盖层
    hideLoading();
}

// 显示错误信息
function showErrorMessage(message) {
    // 先尝试使用showMessage函数
    showMessage(message, 'error');
    
    // 同时创建一个更明显的错误提示
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        background: #f8d7da;
        color: #721c24;
        padding: 15px;
        margin: 15px;
        border-radius: 5px;
        border: 1px solid #f5c6cb;
        position: relative;
        z-index: 9999;
    `;
    errorDiv.innerHTML = `
        <strong><i class="fas fa-exclamation-triangle"></i> 错误:</strong> ${message}
        <br><small>请检查控制台查看详细信息</small>
        <button onclick="this.parentElement.remove()" style="float:right; background:none; border:none; cursor:pointer;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    const container = document.querySelector('.container') || document.querySelector('main') || document.body;
    if (container) {
        container.prepend(errorDiv);
    }
}

// =============== 以下是原有功能的其余部分，保持不变 ===============

// 初始化界面
function initUI() {
    // 初始化标签页
    initTabs();
    
    // 初始化主题
    initTheme();
    
    // 初始化属性搜索选项
    if (dataHandler && dataHandler.getAllAttributes) {
        try {
            initAttributeSearch();
        } catch (error) {
            console.warn('属性搜索初始化失败:', error);
        }
    }
    
    // 显示欢迎消息
    showWelcomeMessage();
    
    console.log('✅ UI初始化完成');
}

// 初始化标签页
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    if (tabButtons.length === 0 || tabContents.length === 0) {
        console.warn('未找到标签页元素');
        return;
    }
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabId = button.getAttribute('data-tab');
            if (!tabId) return;
            
            // 移除所有按钮的激活状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            // 隐藏所有标签内容
            tabContents.forEach(content => content.classList.remove('active'));
            
            // 激活当前按钮和标签内容
            button.classList.add('active');
            const tabContent = document.getElementById(tabId);
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
    
    console.log('✅ 标签页初始化完成');
}

// 初始化主题
function initTheme() {
    // 检查本地存储的主题设置
    const savedTheme = localStorage.getItem('theme') || 'dark';
    currentTheme = savedTheme;
    setTheme(savedTheme);
    
    // 主题切换按钮
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    console.log('✅ 主题初始化完成');
}

// 切换主题
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(currentTheme);
    localStorage.setItem('theme', currentTheme);
    
    showMessage(`已切换到${currentTheme === 'light' ? '亮色' : '暗色'}主题`, 'info');
}

// 设置主题
function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    
    if (theme === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        
        const themeIcon = document.getElementById('theme-toggle')?.querySelector('i');
        if (themeIcon) {
            themeIcon.className = 'fas fa-sun';
        }
    } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        
        const themeIcon = document.getElementById('theme-toggle')?.querySelector('i');
        if (themeIcon) {
            themeIcon.className = 'fas fa-moon';
        }
    }
}

// 加载数据
async function loadData() {
    try {
        showLoading('正在加载数据...');
        
        if (!dataHandler) {
            throw new Error('数据处理器未初始化');
        }
        
        // 使用DataHandler加载数据
        const result = await dataHandler.loadAllData();
        
        weaponData = result.weapons;
        locationData = result.locations;
        ruleData = result.rules;
        
        // 初始化推荐器
        if (typeof MatrixRecommender !== 'undefined') {
            recommender = new MatrixRecommender(weaponData, locationData, ruleData);
        }
        
        // 渲染武器列表
        renderWeaponList();
        
        // 初始化属性搜索选项
        initAttributeSearch();
        
        hideLoading();
        
        console.log(`✅ 数据加载完成: ${weaponData.length}件武器, ${locationData.length}个地点`);
        return result;
        
    } catch (error) {
        console.error('❌ 数据加载失败:', error);
        hideLoading();
        showMessage('数据加载失败，请检查网络连接或刷新页面', 'error');
        throw error;
    }
}

// 渲染武器列表
function renderWeaponList(weapons = weaponData) {
    const weaponList = document.getElementById('weapon-list');
    if (!weaponList) return;
    
    weaponList.innerHTML = '';
    
    if (!weapons || weapons.length === 0) {
        weaponList.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>暂无武器数据</p>
            </div>
        `;
        return;
    }
    
    weapons.forEach(weapon => {
        const weaponItem = createWeaponItem(weapon);
        weaponList.appendChild(weaponItem);
    });
    
    // 更新武器计数
    updateWeaponCounts();
    updateFilteredWeapons();
    
    console.log(`✅ 武器列表渲染完成: ${weapons.length}件武器`);
}

// 创建武器项目（完整版本）
function createWeaponItem(weapon) {
    const isSelected = selectedWeapons.has(weapon.name);
    const isLocked = lockedWeapons.has(weapon.name);
    
    const div = document.createElement('div');
    div.className = 'weapon-item';
    if (isSelected) div.classList.add('selected');
    if (isLocked) div.classList.add('locked');
    div.setAttribute('data-weapon', weapon.name);
    
    const starClass = getStarClass(weapon.star);
    const typeClass = getTypeClass(weapon.type);
    
    div.innerHTML = `
        <div class="weapon-select">
            <input type="checkbox" id="weapon-${weapon.id || weapon.name.replace(/\s+/g, '-')}" ${isSelected ? 'checked' : ''}
                   data-weapon="${weapon.name}">
            <label for="weapon-${weapon.id || weapon.name.replace(/\s+/g, '-')}" class="weapon-checkbox"></label>
        </div>
        <div class="weapon-info">
            <div class="weapon-header">
                <span class="weapon-name">${weapon.name}</span>
                <span class="weapon-star ${starClass}">${weapon.star}</span>
                <span class="weapon-type ${typeClass}">${weapon.type}</span>
            </div>
            <div class="weapon-attributes">
                <span class="attr-type">基础:</span>
                <span class="attr-value attr-base">${weapon.baseAttr || '无'}</span>
                <span class="attr-type">附加:</span>
                <span class="attr-value attr-extra">${weapon.extraAttr || '无'}</span>
                <span class="attr-type">技能:</span>
                <span class="attr-value attr-skill">${weapon.skillAttr || '无'}</span>
            </div>
        </div>
        <div class="weapon-actions">
            <button class="btn-lock ${isLocked ? 'active' : ''}" 
                    data-weapon="${weapon.name}"
                    title="${isLocked ? '取消锁定' : '锁定武器'}">
                <i class="fas ${isLocked ? 'fa-lock' : 'fa-unlock'}"></i>
            </button>
        </div>
    `;
    
    // 绑定事件
    const checkbox = div.querySelector(`#weapon-${weapon.id || weapon.name.replace(/\s+/g, '-')}`);
    const lockBtn = div.querySelector('.btn-lock');
    
    // 选择武器
    if (checkbox) {
        checkbox.addEventListener('change', (e) => {
            const weaponName = e.target.getAttribute('data-weapon');
            const isChecked = e.target.checked;
            
            toggleWeaponSelection(weaponName, isChecked);
        });
    }
    
    // 锁定武器
    if (lockBtn) {
        lockBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const weaponName = e.currentTarget.getAttribute('data-weapon');
            toggleWeaponLock(weaponName);
        });
    }
    
    // 点击整行也可以选中
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.weapon-actions') && e.target.type !== 'checkbox') {
            const checkbox = div.querySelector('input[type="checkbox"]');
            if (checkbox) {
                const isChecked = !checkbox.checked;
                checkbox.checked = isChecked;
                
                const weaponName = checkbox.getAttribute('data-weapon');
                toggleWeaponSelection(weaponName, isChecked);
            }
        }
    });
    
    return div;
}

// 切换武器选择
function toggleWeaponSelection(weaponName, isSelected) {
    if (isSelected) {
        selectedWeapons.add(weaponName);
    } else {
        selectedWeapons.delete(weaponName);
        // 如果取消选择，也取消锁定
        if (lockedWeapons.has(weaponName)) {
            toggleWeaponLock(weaponName);
        }
    }
    
    updateWeaponItemState(weaponName);
    updateStats();
}

// 切换武器锁定
function toggleWeaponLock(weaponName) {
    if (!selectedWeapons.has(weaponName)) {
        showMessage('请先选择武器再锁定', 'warning');
        return;
    }
    
    if (lockedWeapons.has(weaponName)) {
        lockedWeapons.delete(weaponName);
        showMessage(`已取消锁定武器: ${weaponName}`, 'info');
    } else {
        lockedWeapons.add(weaponName);
        showMessage(`已锁定武器: ${weaponName}`, 'success');
    }
    
    updateWeaponItemState(weaponName);
    updateStats();
}

// 更新武器项目状态
function updateWeaponItemState(weaponName) {
    const weaponItem = document.querySelector(`.weapon-item[data-weapon="${weaponName}"]`);
    if (!weaponItem) return;
    
    const isSelected = selectedWeapons.has(weaponName);
    const isLocked = lockedWeapons.has(weaponName);
    
    // 更新选择状态
    if (isSelected) {
        weaponItem.classList.add('selected');
        const checkbox = weaponItem.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = true;
    } else {
        weaponItem.classList.remove('selected');
        const checkbox = weaponItem.querySelector('input[type="checkbox"]');
        if (checkbox) checkbox.checked = false;
    }
    
    // 更新锁定状态
    if (isLocked) {
        weaponItem.classList.add('locked');
        const lockBtn = weaponItem.querySelector('.btn-lock');
        if (lockBtn) {
            lockBtn.classList.add('active');
            lockBtn.innerHTML = '<i class="fas fa-lock"></i>';
            lockBtn.title = '取消锁定';
        }
    } else {
        weaponItem.classList.remove('locked');
        const lockBtn = weaponItem.querySelector('.btn-lock');
        if (lockBtn) {
            lockBtn.classList.remove('active');
            lockBtn.innerHTML = '<i class="fas fa-unlock"></i>';
            lockBtn.title = '锁定武器';
        }
    }
}

// 初始化属性搜索
function initAttributeSearch() {
    if (!dataHandler || typeof dataHandler.getAllAttributes !== 'function') {
        console.warn('DataHandler不可用，无法初始化属性搜索');
        return;
    }
    
    try {
        const attributes = dataHandler.getAllAttributes();
        
        // 填充基础属性选择器
        const baseAttrSelect = document.getElementById('base-attr-select');
        if (baseAttrSelect) {
            baseAttrSelect.innerHTML = '<option value="">选择基础属性</option>';
            if (attributes.baseAttrs && attributes.baseAttrs.length > 0) {
                attributes.baseAttrs.forEach(attr => {
                    const option = document.createElement('option');
                    option.value = attr;
                    option.textContent = attr;
                    baseAttrSelect.appendChild(option);
                });
            }
        }
        
        // 填充附加属性选择器
        const extraAttrSelect = document.getElementById('extra-attr-select');
        if (extraAttrSelect) {
            extraAttrSelect.innerHTML = '<option value="">选择附加属性</option>';
            if (attributes.extraAttrs && attributes.extraAttrs.length > 0) {
                attributes.extraAttrs.forEach(attr => {
                    const option = document.createElement('option');
                    option.value = attr;
                    option.textContent = attr;
                    extraAttrSelect.appendChild(option);
                });
            }
        }
        
        // 填充技能属性选择器
        const skillAttrSelect = document.getElementById('skill-attr-select');
        if (skillAttrSelect) {
            skillAttrSelect.innerHTML = '<option value="">选择技能属性</option>';
            if (attributes.skillAttrs && attributes.skillAttrs.length > 0) {
                attributes.skillAttrs.forEach(attr => {
                    const option = document.createElement('option');
                    option.value = attr;
                    option.textContent = attr;
                    skillAttrSelect.appendChild(option);
                });
            }
        }
        
        console.log('✅ 属性搜索初始化完成');
    } catch (error) {
        console.error('属性搜索初始化失败:', error);
    }
}

// 绑定事件
function bindEvents() {
    // 武器选择相关
    bindWeaponSelectionEvents();
    
    // 属性搜索相关
    bindAttributeSearchEvents();
    
    // 推荐相关
    bindRecommendationEvents();
    
    // 工具按钮
    bindUtilityEvents();
    
    console.log('✅ 事件绑定完成');
}

// 绑定武器选择相关事件
function bindWeaponSelectionEvents() {
    // 全选按钮
    const selectAllBtn = document.getElementById('select-all');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            if (weaponData.length === 0) {
                showMessage('没有武器数据可供选择', 'warning');
                return;
            }
            
            weaponData.forEach(weapon => {
                if (!selectedWeapons.has(weapon.name)) {
                    selectedWeapons.add(weapon.name);
                }
            });
            renderWeaponList();
            updateStats();
            showMessage('已选择所有武器', 'success');
        });
    }
    
    // 清除选择按钮
    const clearAllBtn = document.getElementById('clear-all');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            selectedWeapons.clear();
            lockedWeapons.clear();
            renderWeaponList();
            updateStats();
            showMessage('已清除所有选择', 'info');
        });
    }
    
    // 清除锁定按钮
    const clearLocksBtn = document.getElementById('clear-locks');
    if (clearLocksBtn) {
        clearLocksBtn.addEventListener('click', () => {
            lockedWeapons.clear();
            renderWeaponList();
            updateStats();
            showMessage('已清除所有锁定', 'info');
        });
    }
    
    // 武器搜索框
    const weaponSearchInput = document.getElementById('weapon-search');
    if (weaponSearchInput) {
        weaponSearchInput.addEventListener('input', () => {
            clearTimeout(weaponSearchTimeout);
            weaponSearchTimeout = setTimeout(() => {
                filterWeapons();
            }, 300);
        });
    }
    
    // 清除搜索按钮
    const clearSearchBtn = document.getElementById('clear-search');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (weaponSearchInput) {
                weaponSearchInput.value = '';
            }
            filterWeapons();
        });
    }
    
    // 星级筛选
    const starFilter = document.getElementById('star-filter');
    if (starFilter) {
        starFilter.addEventListener('change', filterWeapons);
    }
    
    // 类型筛选
    const typeFilter = document.getElementById('type-filter');
    if (typeFilter) {
        typeFilter.addEventListener('change', filterWeapons);
    }
}

// 绑定属性搜索相关事件
function bindAttributeSearchEvents() {
    // 属性搜索按钮
    const attrSearchBtn = document.getElementById('attr-search-btn');
    if (attrSearchBtn) {
        attrSearchBtn.addEventListener('click', searchWeaponsByAttributes);
    }
    
    // 清除属性搜索按钮
    const clearAttrSearchBtn = document.getElementById('clear-attr-search');
    if (clearAttrSearchBtn) {
        clearAttrSearchBtn.addEventListener('click', clearAttributeSearch);
    }
    
    // 添加搜索结果的武器
    const addSearchResultsBtn = document.getElementById('add-search-results');
    if (addSearchResultsBtn) {
        addSearchResultsBtn.addEventListener('click', addSearchResultsToSelection);
    }
}

// 绑定推荐相关事件
function bindRecommendationEvents() {
    // 开始推荐按钮
    const startRecommendBtn = document.getElementById('start-recommend');
    if (startRecommendBtn) {
        startRecommendBtn.addEventListener('click', startRecommendation);
    }
    
    // 清空结果按钮
    const clearResultsBtn = document.getElementById('clear-results');
    if (clearResultsBtn) {
        clearResultsBtn.addEventListener('click', clearResults);
    }
    
    // 导出结果按钮
    const exportResultsBtn = document.getElementById('export-results');
    if (exportResultsBtn) {
        exportResultsBtn.addEventListener('click', exportResults);
    }
    
    // 快速推荐按钮
    const quickRecommendBtn = document.getElementById('quick-recommend');
    if (quickRecommendBtn) {
        quickRecommendBtn.addEventListener('click', quickRecommendation);
    }
}

// 绑定工具按钮事件
function bindUtilityEvents() {
    // 数据导出按钮
    const dataExportBtn = document.getElementById('data-export');
    if (dataExportBtn) {
        dataExportBtn.addEventListener('click', exportAllData);
    }
    
    // 刷新数据按钮
    const refreshDataBtn = document.getElementById('refresh-data');
    if (refreshDataBtn) {
        refreshDataBtn.addEventListener('click', refreshData);
    }
    
    // 回到顶部按钮
    const scrollTopBtn = document.getElementById('scroll-top');
    if (scrollTopBtn) {
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// 筛选武器
function filterWeapons() {
    const searchTerm = document.getElementById('weapon-search')?.value.toLowerCase() || '';
    const starFilter = document.getElementById('star-filter')?.value || 'all';
    const typeFilter = document.getElementById('type-filter')?.value || 'all';
    
    // 获取所有武器项目
    const weaponItems = document.querySelectorAll('.weapon-item');
    let visibleCount = 0;
    
    weaponItems.forEach(item => {
        const weaponName = item.getAttribute('data-weapon');
        const weapon = weaponData.find(w => w.name === weaponName);
        if (!weapon) return;
        
        let visible = true;
        
        // 搜索词匹配
        if (searchTerm) {
            const searchTerms = searchTerm.split(' ').filter(term => term.trim());
            if (searchTerms.length > 0) {
                const matches = searchTerms.some(term => 
                    (weapon.name && weapon.name.toLowerCase().includes(term)) ||
                    (weapon.baseAttr && weapon.baseAttr.toLowerCase().includes(term)) ||
                    (weapon.extraAttr && weapon.extraAttr.toLowerCase().includes(term)) ||
                    (weapon.skillAttr && weapon.skillAttr.toLowerCase().includes(term))
                );
                if (!matches) visible = false;
            }
        }
        
        // 星级筛选
        if (starFilter !== 'all' && weapon.star !== starFilter) {
            visible = false;
        }
        
        // 类型筛选
        if (typeFilter !== 'all' && weapon.type !== typeFilter) {
            visible = false;
        }
        
        // 显示或隐藏
        item.style.display = visible ? '' : 'none';
        if (visible) visibleCount++;
    });
    
    // 更新可见武器计数
    const visibleCountElement = document.getElementById('visible-count');
    if (visibleCountElement) {
        visibleCountElement.textContent = visibleCount;
    }
    
    // 如果没有可见武器，显示提示
    if (visibleCount === 0) {
        const weaponList = document.getElementById('weapon-list');
        if (weaponList) {
            weaponList.innerHTML = `
                <div class="empty-message">
                    <i class="fas fa-search"></i>
                    <p>没有找到匹配的武器</p>
                    <p class="hint">尝试调整筛选条件</p>
                </div>
            `;
        }
    }
}

// 根据属性搜索武器
function searchWeaponsByAttributes() {
    try {
        const baseAttr = document.getElementById('base-attr-select')?.value || '';
        const extraAttr = document.getElementById('extra-attr-select')?.value || '';
        const skillAttr = document.getElementById('skill-attr-select')?.value || '';
        
        // 检查是否有选择属性
        if (!baseAttr && !extraAttr && !skillAttr) {
            showMessage('请选择至少一个属性进行搜索', 'warning');
            return;
        }
        
        // 检查dataHandler是否可用
        if (!dataHandler || typeof dataHandler.searchWeapons !== 'function') {
            showMessage('搜索功能暂时不可用', 'error');
            return;
        }
        
        // 搜索武器
        const searchResults = dataHandler.searchWeapons({
            baseAttr,
            extraAttr,
            skillAttr
        });
        
        // 显示搜索结果
        displaySearchResults(searchResults);
        
    } catch (error) {
        console.error('属性搜索失败:', error);
        showMessage('搜索过程中发生错误', 'error');
    }
}

// 显示搜索结果
function displaySearchResults(results) {
    const attrResultsDiv = document.getElementById('attr-results');
    if (!attrResultsDiv) return;
    
    if (!results || results.length === 0) {
        attrResultsDiv.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-search"></i>
                <p>没有找到匹配的武器</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="search-results-header">
            <h4><i class="fas fa-search"></i> 搜索结果 (${results.length}件)</h4>
            <button id="add-search-results" class="btn-small btn-primary">
                <i class="fas fa-plus"></i> 添加全部到选择
            </button>
        </div>
        <div class="search-results-list">
    `;
    
    results.forEach(weapon => {
        const isSelected = selectedWeapons.has(weapon.name);
        const isLocked = lockedWeapons.has(weapon.name);
        
        html += `
            <div class="search-result-item ${isSelected ? 'selected' : ''} ${isLocked ? 'locked' : ''}" 
                 data-weapon="${weapon.name}">
                <div class="result-weapon-info">
                    <span class="result-weapon-name">${weapon.name}</span>
                    <span class="result-weapon-star ${getStarClass(weapon.star)}">${weapon.star}</span>
                    <span class="result-weapon-type ${getTypeClass(weapon.type)}">${weapon.type}</span>
                </div>
                <div class="result-weapon-attrs">
                    <span class="attr-pair">
                        <span class="attr-label">基础:</span>
                        <span class="attr-value">${weapon.baseAttr || '无'}</span>
                    </span>
                    <span class="attr-pair">
                        <span class="attr-label">附加:</span>
                        <span class="attr-value">${weapon.extraAttr || '无'}</span>
                    </span>
                    <span class="attr-pair">
                        <span class="attr-label">技能:</span>
                        <span class="attr-value">${weapon.skillAttr || '无'}</span>
                    </span>
                </div>
                <div class="result-weapon-actions">
                    <button class="btn-small ${isSelected ? 'btn-selected' : 'btn-default'} add-weapon-btn"
                            data-weapon="${weapon.name}">
                        <i class="fas ${isSelected ? 'fa-check' : 'fa-plus'}"></i>
                        ${isSelected ? '已选择' : '选择'}
                    </button>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    attrResultsDiv.innerHTML = html;
    
    // 绑定添加武器按钮事件
    document.querySelectorAll('.add-weapon-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const weaponName = e.currentTarget.getAttribute('data-weapon');
            const isSelected = selectedWeapons.has(weaponName);
            
            if (!isSelected) {
                toggleWeaponSelection(weaponName, true);
                e.currentTarget.innerHTML = '<i class="fas fa-check"></i> 已选择';
                e.currentTarget.classList.remove('btn-default');
                e.currentTarget.classList.add('btn-selected');
                
                // 更新列表项样式
                const resultItem = e.currentTarget.closest('.search-result-item');
                if (resultItem) {
                    resultItem.classList.add('selected');
                }
                
                showMessage(`已添加武器: ${weaponName}`, 'success');
            } else {
                showMessage('武器已在选择列表中', 'info');
            }
        });
    });
    
    // 绑定添加全部按钮事件
    const addAllBtn = document.getElementById('add-search-results');
    if (addAllBtn) {
        addAllBtn.addEventListener('click', addSearchResultsToSelection);
    }
}

// 添加搜索结果到选择
function addSearchResultsToSelection() {
    const resultItems = document.querySelectorAll('.search-result-item');
    let addedCount = 0;
    
    resultItems.forEach(item => {
        const weaponName = item.getAttribute('data-weapon');
        if (!selectedWeapons.has(weaponName)) {
            selectedWeapons.add(weaponName);
            addedCount++;
            
            // 更新UI
            const addBtn = item.querySelector('.add-weapon-btn');
            if (addBtn) {
                addBtn.innerHTML = '<i class="fas fa-check"></i> 已选择';
                addBtn.classList.remove('btn-default');
                addBtn.classList.add('btn-selected');
            }
            item.classList.add('selected');
        }
    });
    
    // 更新武器列表
    updateWeaponItemStates();
    updateStats();
    
    if (addedCount > 0) {
        showMessage(`已添加 ${addedCount} 件武器到选择列表`, 'success');
    } else {
        showMessage('所有搜索结果已在选择列表中', 'info');
    }
}

// 清除属性搜索
function clearAttributeSearch() {
    // 清除选择器
    const baseAttrSelect = document.getElementById('base-attr-select');
    const extraAttrSelect = document.getElementById('extra-attr-select');
    const skillAttrSelect = document.getElementById('skill-attr-select');
    
    if (baseAttrSelect) baseAttrSelect.value = '';
    if (extraAttrSelect) extraAttrSelect.value = '';
    if (skillAttrSelect) skillAttrSelect.value = '';
    
    // 清除结果显示
    const attrResultsDiv = document.getElementById('attr-results');
    if (attrResultsDiv) {
        attrResultsDiv.innerHTML = `
            <div class="empty-message">
                <i class="fas fa-search"></i>
                <p>选择属性进行搜索</p>
            </div>
        `;
    }
    
    showMessage('已清除属性搜索条件', 'info');
}

// 开始推荐
async function startRecommendation() {
    if (selectedWeapons.size === 0) {
        showMessage('请先选择至少一件武器', 'warning');
        return;
    }
    
    if (!recommender) {
        showMessage('推荐功能暂时不可用', 'error');
        return;
    }
    
    try {
        showLoading('正在计算推荐方案...');
        
        const selectedWeaponsArray = Array.from(selectedWeapons);
        const lockedWeaponsArray = Array.from(lockedWeapons);
        
        // 获取推荐结果
        const recommendations = recommender.recommendLocations(
            selectedWeaponsArray,
            lockedWeaponsArray
        );
        
        // 渲染推荐结果
        renderRecommendationResults(recommendations, selectedWeaponsArray, lockedWeaponsArray);
        
        hideLoading();
        
        showMessage(`推荐完成，找到 ${recommendations.length} 个推荐地点`, 'success');
        
    } catch (error) {
        console.error('推荐失败:', error);
        hideLoading();
        showMessage('推荐过程中发生错误', 'error');
    }
}

// 快速推荐
function quickRecommendation() {
    // 如果有选中的武器，直接开始推荐
    if (selectedWeapons.size > 0) {
        startRecommendation();
    } else {
        // 否则自动选择当前显示的所有武器
        const visibleWeapons = document.querySelectorAll('.weapon-item:not([style*="display: none"])');
        if (visibleWeapons.length === 0) {
            showMessage('没有可选择的武器', 'warning');
            return;
        }
        
        visibleWeapons.forEach(item => {
            const weaponName = item.getAttribute('data-weapon');
            if (!selectedWeapons.has(weaponName)) {
                selectedWeapons.add(weaponName);
            }
        });
        
        // 更新UI
        updateWeaponItemStates();
        updateStats();
        
        if (selectedWeapons.size > 0) {
            showMessage(`已选择 ${selectedWeapons.size} 件武器，开始推荐...`, 'success');
            setTimeout(startRecommendation, 500);
        } else {
            showMessage('没有可选择的武器', 'warning');
        }
    }
}

// 渲染推荐结果
function renderRecommendationResults(recommendations, selectedWeapons, lockedWeapons) {
    const resultOutput = document.getElementById('result-output');
    if (!resultOutput) return;
    
    if (!recommendations || recommendations.length === 0) {
        resultOutput.innerHTML = `
            <div class="no-recommendations">
                <i class="fas fa-map-marker-alt fa-3x"></i>
                <h3>未找到合适的推荐地点</h3>
                <p>尝试选择不同的武器组合或调整锁定设置</p>
            </div>
        `;
        return;
    }
    
    let html = `
        <div class="recommendation-header">
            <div class="recommendation-title">
                <h3><i class="fas fa-chart-bar"></i> 推荐分析报告</h3>
                <span class="recommendation-date">${new Date().toLocaleString('zh-CN')}</span>
            </div>
            <div class="recommendation-summary">
                <div class="summary-item">
                    <span class="summary-label">分析武器:</span>
                    <span class="summary-value">${selectedWeapons.length} 件</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">锁定武器:</span>
                    <span class="summary-value">${lockedWeapons.length} 件</span>
                </div>
                <div class="summary-item">
                    <span class="summary-label">推荐地点:</span>
                    <span class="summary-value">${recommendations.length} 个</span>
                </div>
            </div>
        </div>
        
        <div class="selected-weapons-summary">
            <h4><i class="fas fa-swords"></i> 已选武器列表</h4>
            <div class="weapon-tags">
                ${selectedWeapons.map(weapon => {
                    const isLocked = lockedWeapons.includes(weapon);
                    return `
                        <span class="weapon-tag ${isLocked ? 'locked' : ''}">
                            ${isLocked ? '<i class="fas fa-lock"></i>' : ''}
                            ${weapon}
                        </span>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    // 最佳推荐
    const bestRecommendation = recommendations[0];
    html += createRecommendationCard(bestRecommendation, selectedWeapons, lockedWeapons, true);
    
    // 其他推荐
    if (recommendations.length > 1) {
        html += `
            <div class="other-recommendations">
                <h4><i class="fas fa-list-ol"></i> 其他推荐地点</h4>
                <div class="recommendation-grid">
        `;
        
        recommendations.slice(1, 4).forEach((rec, index) => {
            html += createRecommendationCard(rec, selectedWeapons, lockedWeapons, false, index + 2);
        });
        
        html += `
                </div>
            </div>
        `;
    }
    
    // 分析报告
    html += createAnalysisReport(selectedWeapons, lockedWeapons);
    
    resultOutput.innerHTML = html;
    
    // 滚动到结果区域
    resultOutput.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 创建推荐卡片
function createRecommendationCard(recommendation, selectedWeapons, lockedWeapons, isBest = false, rank = 1) {
    let engraving = { baseAttributes: [], attributeType: '附加属性', attribute: '无' };
    
    if (recommender && typeof recommender.recommendEngravingAttributes === 'function') {
        try {
            engraving = recommender.recommendEngravingAttributes(
                selectedWeapons,
                lockedWeapons,
                recommendation.location
            );
        } catch (error) {
            console.warn('获取刻写方案失败:', error);
        }
    }
    
    return `
        <div class="recommendation-card ${isBest ? 'best-card' : ''}">
            <div class="card-header">
                <div class="card-rank">
                    ${isBest ? '<i class="fas fa-crown"></i> 最佳推荐' : `#${rank}`}
                </div>
                <h5 class="card-title">
                    <i class="fas fa-map-marker-alt"></i> ${recommendation.location || '未知地点'}
                </h5>
                <div class="card-scores">
                    <span class="score-badge">
                        <i class="fas fa-star"></i> ${recommendation.score || 0}分
                    </span>
                    <span class="coverage-badge">
                        <i class="fas fa-percentage"></i> ${Math.round((recommendation.coverage || 0) * 100)}%
                    </span>
                </div>
            </div>
            
            <div class="card-body">
                <div class="engraving-recommendation">
                    <h6><i class="fas fa-pencil-alt"></i> 预刻写方案</h6>
                    
                    <div class="base-attributes-section">
                        <div class="section-title">基础属性 (选3条)</div>
                        <div class="base-attributes-list">
                            ${(engraving.baseAttributes || []).map(attr => `
                                <span class="base-attr-item">
                                    <i class="fas fa-circle"></i> ${attr}
                                </span>
                            `).join('')}
                            ${(!engraving.baseAttributes || engraving.baseAttributes.length === 0) ? 
                                '<span class="base-attr-item"><i class="fas fa-circle"></i> 暂无数据</span>' : ''}
                        </div>
                    </div>
                    
                    <div class="extra-skill-section">
                        <div class="section-title">${engraving.attributeType || '附加属性'} (选1条)</div>
                        <div class="attribute-item ${engraving.attributeType === '技能属性' ? 'skill' : 'extra'}">
                            <i class="fas ${engraving.attributeType === '技能属性' ? 'fa-bolt' : 'fa-plus'}"></i>
                            ${engraving.attribute || '无'}
                        </div>
                    </div>
                </div>
                
                <div class="matched-properties">
                    <h6><i class="fas fa-check-circle"></i> 属性匹配</h6>
                    <div class="match-stats">
                        <div class="match-stat">
                            <span class="stat-label">基础属性</span>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: ${((recommendation.matched?.base || 0) / selectedWeapons.length) * 100}%"></div>
                            </div>
                            <span class="stat-value">${recommendation.matched?.base || 0}/${selectedWeapons.length}</span>
                        </div>
                        <div class="match-stat">
                            <span class="stat-label">附加属性</span>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: ${((recommendation.matched?.extra || 0) / selectedWeapons.length) * 100}%"></div>
                            </div>
                            <span class="stat-value">${recommendation.matched?.extra || 0}/${selectedWeapons.length}</span>
                        </div>
                        <div class="match-stat">
                            <span class="stat-label">技能属性</span>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: ${((recommendation.matched?.skill || 0) / selectedWeapons.length) * 100}%"></div>
                            </div>
                            <span class="stat-value">${recommendation.matched?.skill || 0}/${selectedWeapons.length}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            ${isBest ? `
                <div class="card-footer">
                    <button class="btn-primary save-recommendation" 
                            data-location="${recommendation.location}">
                        <i class="fas fa-save"></i> 保存方案
                    </button>
                    <button class="btn-secondary share-recommendation"
                            data-location="${recommendation.location}">
                        <i class="fas fa-share-alt"></i> 分享
                    </button>
                </div>
            ` : ''}
        </div>
    `;
}

// 创建分析报告
function createAnalysisReport(selectedWeapons, lockedWeapons) {
    let analysis = { base: {}, skill: {} };
    
    if (recommender && typeof recommender.analyzeWeaponsAttributes === 'function') {
        try {
            analysis = recommender.analyzeWeaponsAttributes(selectedWeapons);
        } catch (error) {
            console.warn('武器属性分析失败:', error);
        }
    }
    
    return `
        <div class="analysis-report">
            <div class="report-header">
                <h4><i class="fas fa-chart-pie"></i> 属性分析报告</h4>
                <div class="report-actions">
                    <button class="btn-small" id="export-analysis">
                        <i class="fas fa-download"></i> 导出分析
                    </button>
                </div>
            </div>
            
            <div class="analysis-grid">
                <div class="analysis-section">
                    <h5>基础属性分布</h5>
                    <div class="attr-distribution">
                        ${Object.entries(analysis.base || {})
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([attr, count]) => `
                                <div class="dist-item">
                                    <span class="dist-name">${attr}</span>
                                    <div class="dist-bar">
                                        <div class="dist-fill" 
                                             style="width: ${(count / selectedWeapons.length) * 100}%">
                                        </div>
                                    </div>
                                    <span class="dist-count">${count}</span>
                                </div>
                            `).join('')}
                        ${Object.keys(analysis.base || {}).length === 0 ? 
                            '<div class="dist-item"><span class="dist-name">暂无数据</span></div>' : ''}
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h5>技能属性分布</h5>
                    <div class="attr-distribution">
                        ${Object.entries(analysis.skill || {})
                            .sort(([,a], [,b]) => b - a)
                            .slice(0, 5)
                            .map(([attr, count]) => `
                                <div class="dist-item">
                                    <span class="dist-name">${attr}</span>
                                    <div class="dist-bar">
                                        <div class="dist-fill" 
                                             style="width: ${(count / selectedWeapons.length) * 100}%">
                                        </div>
                                    </div>
                                    <span class="dist-count">${count}</span>
                                </div>
                            `).join('')}
                        ${Object.keys(analysis.skill || {}).length === 0 ? 
                            '<div class="dist-item"><span class="dist-name">暂无数据</span></div>' : ''}
                    </div>
                </div>
                
                <div class="analysis-section">
                    <h5>武器类型分布</h5>
                    <div class="type-distribution">
                        ${getWeaponTypeDistribution(selectedWeapons)}
                    </div>
                </div>
            </div>
            
            ${lockedWeapons.length > 0 ? `
                <div class="priority-analysis">
                    <h5><i class="fas fa-lock"></i> 锁定武器分析</h5>
                    <div class="locked-weapons-list">
                        ${lockedWeapons.map(weapon => `
                            <div class="locked-weapon">
                                <span class="locked-name">${weapon}</span>
                                <span class="locked-attrs">
                                    ${getWeaponAttributesText(weapon)}
                                </span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;
}

// 获取武器类型分布
function getWeaponTypeDistribution(selectedWeapons) {
    const typeCounts = {};
    selectedWeapons.forEach(weaponName => {
        const weapon = weaponData.find(w => w.name === weaponName);
        if (weapon && weapon.type) {
            typeCounts[weapon.type] = (typeCounts[weapon.type] || 0) + 1;
        }
    });
    
    const total = selectedWeapons.length;
    const entries = Object.entries(typeCounts);
    
    if (entries.length === 0) {
        return '<div class="type-item"><span class="type-name">未知类型</span></div>';
    }
    
    return entries
        .map(([type, count]) => `
            <div class="type-item">
                <span class="type-name">${type}</span>
                <div class="type-bar">
                    <div class="type-fill" style="width: ${(count / total) * 100}%"></div>
                </div>
                <span class="type-count">${count} (${Math.round((count / total) * 100)}%)</span>
            </div>
        `).join('');
}

// 获取武器属性文本
function getWeaponAttributesText(weaponName) {
    const weapon = weaponData.find(w => w.name === weaponName);
    if (!weapon) return '未知属性';
    
    return `${weapon.baseAttr || '无'} / ${weapon.extraAttr || '无'} / ${weapon.skillAttr || '无'}`;
}

// 清除结果
function clearResults() {
    const resultOutput = document.getElementById('result-output');
    if (resultOutput) {
        resultOutput.innerHTML = '';
        showMessage('已清除推荐结果', 'info');
    }
}

// 导出结果
function exportResults() {
    try {
        const resultOutput = document.getElementById('result-output');
        if (!resultOutput || !resultOutput.innerHTML.trim()) {
            showMessage('没有结果可以导出', 'warning');
            return;
        }
        
        // 创建导出内容
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const fileName = `武器基质推荐_${timestamp}.txt`;
        
        let exportContent = '明日方舟终末地 - 武器基质刷取推荐\n';
        exportContent += '='.repeat(50) + '\n\n';
        exportContent += `生成时间: ${new Date().toLocaleString('zh-CN')}\n`;
        exportContent += `选择武器: ${Array.from(selectedWeapons).join(', ')}\n`;
        exportContent += `锁定武器: ${Array.from(lockedWeapons).join(', ')}\n\n`;
        
        // 添加推荐结果文本
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = resultOutput.innerHTML;
        
        // 提取文本内容
        const textNodes = [];
        const extractText = (node) => {
            if (node.nodeType === Node.TEXT_NODE) {
                const text = node.textContent.trim();
                if (text) textNodes.push(text);
            } else {
                node.childNodes.forEach(extractText);
            }
        };
        extractText(tempDiv);
        
        exportContent += textNodes.join('\n');
        
        // 创建下载链接
        const blob = new Blob([exportContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('结果导出成功', 'success');
        
    } catch (error) {
        console.error('导出失败:', error);
        showMessage('导出过程中发生错误', 'error');
    }
}

// 导出所有数据
function exportAllData() {
    try {
        if (!dataHandler) {
            showMessage('数据未加载，无法导出', 'warning');
            return;
        }
        
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
        const fileName = `武器基质数据_${timestamp}.json`;
        
        const exportData = {
            meta: {
                exportedAt: new Date().toISOString(),
                system: '明日方舟终末地武器基质推荐系统',
                version: '1.0'
            },
            weapons: weaponData,
            locations: locationData,
            rules: ruleData,
            currentSelection: {
                selectedWeapons: Array.from(selectedWeapons),
                lockedWeapons: Array.from(lockedWeapons),
                timestamp: new Date().toISOString()
            }
        };
        
        const jsonStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('数据导出成功', 'success');
        
    } catch (error) {
        console.error('数据导出失败:', error);
        showMessage('数据导出失败', 'error');
    }
}

// 刷新数据
async function refreshData() {
    try {
        showLoading('正在刷新数据...');
        
        // 清除缓存
        if (dataHandler && typeof dataHandler.clearCache === 'function') {
            dataHandler.clearCache();
        }
        
        // 重新加载数据
        await loadData();
        
        hideLoading();
        showMessage('数据刷新成功', 'success');
        
    } catch (error) {
        console.error('数据刷新失败:', error);
        hideLoading();
        showMessage('数据刷新失败', 'error');
    }
}

// 更新武器计数
function updateWeaponCounts() {
    const totalCount = document.getElementById('total-count');
    const selectedCount = document.getElementById('selected-count');
    const lockedCount = document.getElementById('locked-count');
    const lockedCountDisplay = document.getElementById('locked-count-display');
    
    if (totalCount) totalCount.textContent = weaponData.length;
    if (selectedCount) selectedCount.textContent = selectedWeapons.size;
    if (lockedCount) lockedCount.textContent = lockedWeapons.size;
    if (lockedCountDisplay) lockedCountDisplay.textContent = lockedWeapons.size;
}

// 更新筛选后的武器计数
function updateFilteredWeapons() {
    const weaponItems = document.querySelectorAll('.weapon-item');
    const visibleItems = Array.from(weaponItems).filter(item => 
        item.style.display !== 'none'
    );
    
    const visibleCount = document.getElementById('visible-count');
    if (visibleCount) {
        visibleCount.textContent = visibleItems.length;
    }
}

// 更新所有武器项目状态
function updateWeaponItemStates() {
    weaponData.forEach(weapon => {
        updateWeaponItemState(weapon.name);
    });
}

// 更新统计信息
function updateStats() {
    // 更新武器计数
    updateWeaponCounts();
    
    // 更新总览统计
    const totalWeaponsElem = document.getElementById('total-weapons');
    const totalLocationsElem = document.getElementById('total-locations');
    
    if (totalWeaponsElem) totalWeaponsElem.textContent = weaponData.length;
    if (totalLocationsElem) totalLocationsElem.textContent = locationData.length;
    
    // 更新状态栏
    updateStatusBar();
}

// 更新状态栏
function updateStatusBar() {
    const statusBar = document.querySelector('.status-bar');
    if (!statusBar) return;
    
    let statusText = `已选择 ${selectedWeapons.size} 件武器`;
    if (lockedWeapons.size > 0) {
        statusText += ` (${lockedWeapons.size} 件锁定)`;
    }
    
    statusBar.textContent = statusText;
}

// 显示加载动画
function showLoading(message = '加载中...') {
    // 移除现有的加载动画
    hideLoading();
    
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'loading-overlay';
    loadingOverlay.className = 'loading-overlay';
    loadingOverlay.innerHTML = `
        <div class="loading-spinner">
            <div class="spinner"></div>
            <p>${message}</p>
        </div>
    `;
    
    document.body.appendChild(loadingOverlay);
    
    // 防止滚动
    document.body.style.overflow = 'hidden';
}

// 隐藏加载动画
function hideLoading() {
    const loadingOverlay = document.getElementById('loading-overlay');
    if (loadingOverlay) {
        loadingOverlay.classList.add('fade-out');
        setTimeout(() => {
            if (loadingOverlay.parentNode) {
                loadingOverlay.parentNode.removeChild(loadingOverlay);
            }
        }, 300);
    }
    
    // 恢复滚动
    document.body.style.overflow = '';
}

// 显示消息
function showMessage(message, type = 'info') {
    // 移除现有的消息
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(msg => {
        msg.classList.add('fade-out');
        setTimeout(() => {
            if (msg.parentNode) {
                msg.parentNode.removeChild(msg);
            }
        }, 300);
    });
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    messageDiv.innerHTML = `
        <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
        <span>${message}</span>
        <button class="message-close"><i class="fas fa-times"></i></button>
    `;
    
    document.body.appendChild(messageDiv);
    
    // 自动消失
    setTimeout(() => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 5000);
    
    // 关闭按钮
    messageDiv.querySelector('.message-close').addEventListener('click', () => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    });
}

// 显示欢迎消息
function showWelcomeMessage() {
    const welcomeDiv = document.createElement('div');
    welcomeDiv.className = 'welcome-message';
    welcomeDiv.innerHTML = `
        <div class="welcome-content">
            <h3><i class="fas fa-gem"></i> 欢迎使用武器基质推荐系统</h3>
            <p>🎮 专为《明日方舟：终末地》打造的武器基质刷取推荐工具</p>
            <div class="welcome-features">
                <div class="feature">
                    <i class="fas fa-check-circle"></i>
                    <span>智能推荐刷取地点</span>
                </div>
                <div class="feature">
                    <i class="fas fa-lock"></i>
                    <span>支持武器优先级设置</span>
                </div>
                <div class="feature">
                    <i class="fas fa-chart-bar"></i>
                    <span>详细的属性分析</span>
                </div>
                <div class="feature">
                    <i class="fas fa-search"></i>
                    <span>强大的搜索功能</span>
                </div>
            </div>
            <button class="btn-primary" id="start-tutorial">
                <i class="fas fa-play"></i> 开始使用教程
            </button>
        </div>
    `;
    
    document.body.appendChild(welcomeDiv);
    
    // 绑定教程按钮
    const tutorialBtn = document.getElementById('start-tutorial');
    if (tutorialBtn) {
        tutorialBtn.addEventListener('click', () => {
            welcomeDiv.classList.add('fade-out');
            setTimeout(() => {
                if (welcomeDiv.parentNode) {
                    welcomeDiv.parentNode.removeChild(welcomeDiv);
                }
            }, 300);
            
            showMessage('教程功能开发中，请参考右上角的使用指南', 'info');
        });
    }
    
    // 5秒后自动消失
    setTimeout(() => {
        welcomeDiv.classList.add('fade-out');
        setTimeout(() => {
            if (welcomeDiv.parentNode) {
                welcomeDiv.parentNode.removeChild(welcomeDiv);
            }
        }, 300);
    }, 5000);
}

// 工具函数
function getStarClass(star) {
    const starClasses = {
        '六星': 'star-six',
        '五星': 'star-five',
        '四星': 'star-four',
        '三星': 'star-three',
        '二星': 'star-two',
        '一星': 'star-one'
    };
    return starClasses[star] || 'star-default';
}

function getTypeClass(type) {
    const typeClasses = {
        '单手剑': 'type-sword',
        '双手剑': 'type-greatsword',
        '长柄武器': 'type-polearm',
        '手铳': 'type-handgun',
        '施术单元': 'type-staff',
        '法杖': 'type-staff',
        '弓': 'type-bow',
        '弩': 'type-crossbow'
    };
    return typeClasses[type] || 'type-default';
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 导出到全局作用域（如果需要）
window.WeaponMatrixSystem = {
    dataHandler,
    recommender,
    selectedWeapons,
    lockedWeapons,
    weaponData,
    locationData,
    ruleData,
    reloadData: loadData,
    startRecommendation,
    clearSelection: () => {
        selectedWeapons.clear();
        lockedWeapons.clear();
        renderWeaponList();
        updateStats();
    }
};

console.log('📦 script.js 加载完成');