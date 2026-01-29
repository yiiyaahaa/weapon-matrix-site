// data-handler.js
// 数据加载和管理模块

class DataHandler {
    constructor() {
        // 自动检测环境，设置正确的数据路径
        const isGitHubPages = window.location.hostname.includes('github.io');
        if (isGitHubPages) {
            // GitHub Pages 环境
            const repoName = window.location.pathname.split('/')[1] || 'weapon-matrix-site';
            this.dataPath = `/${repoName}/data/`;
            console.log(`🌐 GitHub Pages 环境，数据路径: ${this.dataPath}`);
        } else {
            // 本地开发环境
            this.dataPath = 'data/';
            console.log(`💻 本地开发环境，数据路径: ${this.dataPath}`);
        }
        
        this.cache = new Map();
        this.isLoaded = false;
    }

    // 加载所有数据
    async loadAllData() {
        try {
            console.log('📥 开始加载数据...');
            
            const startTime = Date.now();
            
            // 并行加载所有数据
            const [weapons, locations, rules] = await Promise.all([
                this.loadWeapons(),
                this.loadLocations(),
                this.loadRules()
            ]);
            
            const loadTime = Date.now() - startTime;
            
            this.cache.set('weapons', weapons);
            this.cache.set('locations', locations);
            this.cache.set('rules', rules);
            this.isLoaded = true;
            
            console.log(`✅ 数据加载完成，耗时 ${loadTime}ms`);
            console.log(`  武器: ${weapons.length} 件`);
            console.log(`  地点: ${locations.length} 个`);
            
            return {
                weapons,
                locations,
                rules,
                loadTime
            };
            
        } catch (error) {
            console.error('❌ 数据加载失败:', error);
            
            // 尝试使用备用数据
            console.log('🔄 尝试使用备用数据...');
            try {
                const fallbackData = await this.loadFallbackData();
                return fallbackData;
            } catch (fallbackError) {
                console.error('❌ 备用数据也加载失败:', fallbackError);
                throw new Error('所有数据源都加载失败，请检查数据文件');
            }
        }
    }

    // 加载武器数据
    async loadWeapons() {
        try {
            console.log(`🔍 尝试加载武器数据，路径: ${this.dataPath}weapons.json`);
            const response = await fetch(`${this.dataPath}weapons.json`);
            
            if (!response.ok) {
                throw new Error(`武器数据加载失败: ${response.status} ${response.statusText}`);
            }
            
            const weapons = await response.json();
            console.log(`✅ 武器数据加载成功，共 ${weapons.length} 件`);
            
            // 验证武器数据
            const validatedWeapons = this.validateWeapons(weapons);
            return validatedWeapons;
            
        } catch (error) {
            console.error('武器数据加载失败:', error);
            
            // 尝试多个备用路径
            const fallbackPaths = [
                'data/weapons.json',
                './data/weapons.json',
                '../data/weapons.json',
                'weapons.json'
            ];
            
            for (const path of fallbackPaths) {
                try {
                    console.log(`🔄 尝试备用路径: ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        const weapons = await response.json();
                        console.log(`✅ 从备用路径 ${path} 加载成功`);
                        return this.validateWeapons(weapons);
                    }
                } catch (fallbackError) {
                    console.log(`❌ 备用路径 ${path} 失败:`, fallbackError.message);
                }
            }
            
            throw error;
        }
    }

    // 加载地点数据
    async loadLocations() {
        try {
            console.log(`🔍 尝试加载地点数据，路径: ${this.dataPath}locations.json`);
            const response = await fetch(`${this.dataPath}locations.json`);
            
            if (!response.ok) {
                throw new Error(`地点数据加载失败: ${response.status} ${response.statusText}`);
            }
            
            const locations = await response.json();
            console.log(`✅ 地点数据加载成功，共 ${locations.length} 个`);
            
            // 验证地点数据
            const validatedLocations = this.validateLocations(locations);
            return validatedLocations;
            
        } catch (error) {
            console.error('地点数据加载失败:', error);
            
            // 尝试多个备用路径
            const fallbackPaths = [
                'data/locations.json',
                './data/locations.json',
                '../data/locations.json',
                'locations.json'
            ];
            
            for (const path of fallbackPaths) {
                try {
                    console.log(`🔄 尝试备用路径: ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        const locations = await response.json();
                        console.log(`✅ 从备用路径 ${path} 加载成功`);
                        return this.validateLocations(locations);
                    }
                } catch (fallbackError) {
                    console.log(`❌ 备用路径 ${path} 失败:`, fallbackError.message);
                }
            }
            
            throw error;
        }
    }

    // 加载规则数据
    async loadRules() {
        try {
            console.log(`🔍 尝试加载规则数据，路径: ${this.dataPath}rules.json`);
            const response = await fetch(`${this.dataPath}rules.json`);
            
            if (!response.ok) {
                throw new Error(`规则数据加载失败: ${response.status} ${response.statusText}`);
            }
            
            const rules = await response.json();
            console.log('✅ 规则数据加载成功');
            return rules;
            
        } catch (error) {
            console.error('规则数据加载失败:', error);
            
            // 尝试多个备用路径
            const fallbackPaths = [
                'data/rules.json',
                './data/rules.json',
                '../data/rules.json',
                'rules.json'
            ];
            
            for (const path of fallbackPaths) {
                try {
                    console.log(`🔄 尝试备用路径: ${path}`);
                    const response = await fetch(path);
                    if (response.ok) {
                        const rules = await response.json();
                        console.log(`✅ 从备用路径 ${path} 加载成功`);
                        return rules;
                    }
                } catch (fallbackError) {
                    console.log(`❌ 备用路径 ${path} 失败:`, fallbackError.message);
                }
            }
            
            console.error('所有规则数据路径都失败，返回默认规则');
            return this.getDefaultRules();
        }
    }

    // 加载备用数据
    async loadFallbackData() {
        console.log('⚠️ 加载备用数据');
        
        try {
            // 尝试加载测试数据
            const testWeapons = [
                {
                    id: 1,
                    name: "测试武器·壹",
                    baseAttr: "攻击力",
                    extraAttr: "暴击率",
                    skillAttr: "破甲",
                    star: "六星",
                    type: "单手剑",
                    description: "测试用武器"
                },
                {
                    id: 2,
                    name: "测试武器·贰",
                    baseAttr: "生命值",
                    extraAttr: "防御力",
                    skillAttr: "治疗",
                    star: "五星",
                    type: "双手剑",
                    description: "测试用武器"
                }
            ];
            
            const testLocations = [
                {
                    id: 1,
                    name: "测试地点",
                    base: ["攻击力", "生命值", "防御力"],
                    extra: ["暴击率", "暴击伤害"],
                    skill: ["破甲", "治疗"],
                    description: "测试用地点",
                    difficulty: "普通",
                    cost: 10,
                    recommendedLevel: 1
                }
            ];
            
            const rules = this.getDefaultRules();
            
            this.cache.set('weapons', testWeapons);
            this.cache.set('locations', testLocations);
            this.cache.set('rules', rules);
            this.isLoaded = true;
            
            return {
                weapons: testWeapons,
                locations: testLocations,
                rules: rules,
                loadTime: 0
            };
            
        } catch (error) {
            throw new Error('备用数据加载失败');
        }
    }

    // 验证武器数据
    validateWeapons(weapons) {
        if (!Array.isArray(weapons)) {
            throw new Error('武器数据格式错误：应为数组');
        }
        
        return weapons.map((weapon, index) => {
            // 确保每个武器都有必要的字段
            return {
                id: weapon.id || index + 1,
                name: weapon.name || `未知武器 ${index + 1}`,
                baseAttr: weapon.baseAttr || '',
                extraAttr: weapon.extraAttr || '',
                skillAttr: weapon.skillAttr || '',
                star: weapon.star || '未知',
                type: weapon.type || '未知',
                description: weapon.description || '',
                // 添加排序字段
                sortOrder: weapon.sortOrder || index
            };
        }).sort((a, b) => {
            // 按星级排序：六星 > 五星 > 四星 > 其他
            const starOrder = { '六星': 0, '五星': 1, '四星': 2, '四星以下': 3, '未知': 4 };
            const aOrder = starOrder[a.star] || 4;
            const bOrder = starOrder[b.star] || 4;
            
            if (aOrder !== bOrder) return aOrder - bOrder;
            // 星级相同按类型排序
            const typeOrder = { '单手剑': 0, '双手剑': 1, '长柄武器': 2, '手铳': 3, '施术单元': 4 };
            const aTypeOrder = typeOrder[a.type] || 5;
            const bTypeOrder = typeOrder[b.type] || 5;
            
            if (aTypeOrder !== bTypeOrder) return aTypeOrder - bTypeOrder;
            
            // 类型相同按名称排序
            return a.name.localeCompare(b.name, 'zh-CN');
        });
    }

    // 验证地点数据
    validateLocations(locations) {
        if (!Array.isArray(locations)) {
            throw new Error('地点数据格式错误：应为数组');
        }
        
        return locations.map((location, index) => {
            return {
                id: location.id || index + 1,
                name: location.name || `未知地点 ${index + 1}`,
                base: Array.isArray(location.base) ? location.base : [],
                extra: Array.isArray(location.extra) ? location.extra : [],
                skill: Array.isArray(location.skill) ? location.skill : [],
                description: location.description || '',
                difficulty: location.difficulty || '普通',
                cost: location.cost || 0,
                recommendedLevel: location.recommendedLevel || 0
            };
        });
    }

    // 获取默认规则
    getDefaultRules() {
        return {
            content: "-基质预刻写-\n·管理员可以在重度能量淤积点处进行基质预刻写。\n·可进入属性选择界面，选定至少三条基础属性以及一条附加属性或技能属性，完成基质预刻写。\n·完成重度能量淤积点挑战后可获得奖励基质，其属性刻写规则如下：\n1.必定出现三条预刻写基础属性中的一条；\n2.必定出现一条预刻写附加属性或技能属性；\n3.其余属性将在该重度能量淤积点的属性库中随机刻写。\n·不同位置的重度能量淤积点可刻写的属性不同。",
            version: "1.0",
            updated: "2024-01"
        };
    }

    // 获取数据统计
    getStats() {
        const weapons = this.cache.get('weapons') || [];
        const locations = this.cache.get('locations') || [];
        
        // 按星级统计
        const starStats = {};
        weapons.forEach(weapon => {
            starStats[weapon.star] = (starStats[weapon.star] || 0) + 1;
        });
        
        // 按类型统计
        const typeStats = {};
        weapons.forEach(weapon => {
            typeStats[weapon.type] = (typeStats[weapon.type] || 0) + 1;
        });
        
        // 属性统计
        const baseAttrStats = {};
        const extraAttrStats = {};
        const skillAttrStats = {};
        
        weapons.forEach(weapon => {
            if (weapon.baseAttr) {
                baseAttrStats[weapon.baseAttr] = (baseAttrStats[weapon.baseAttr] || 0) + 1;
            }
            if (weapon.extraAttr) {
                extraAttrStats[weapon.extraAttr] = (extraAttrStats[weapon.extraAttr] || 0) + 1;
            }
            if (weapon.skillAttr) {
                skillAttrStats[weapon.skillAttr] = (skillAttrStats[weapon.skillAttr] || 0) + 1;
            }
        });
        
        return {
            totalWeapons: weapons.length,
            totalLocations: locations.length,
            starStats,
            typeStats,
            baseAttrStats,
            extraAttrStats,
            skillAttrStats,
            lastUpdated: new Date().toISOString()
        };
    }

    // 搜索武器
    searchWeapons(query, filters = {}) {
        const weapons = this.cache.get('weapons') || [];
        
        return weapons.filter(weapon => {
            // 关键词搜索
            if (query) {
                const searchLower = query.toLowerCase();
                const searchTerms = searchLower.split(' ');
                
                const nameMatch = searchTerms.some(term => 
                    weapon.name.toLowerCase().includes(term)
                );
                const attrMatch = searchTerms.some(term =>
                    weapon.baseAttr.toLowerCase().includes(term) ||
                    weapon.extraAttr.toLowerCase().includes(term) ||
                    weapon.skillAttr.toLowerCase().includes(term)
                );
                
                if (!nameMatch && !attrMatch) {
                    return false;
                }
            }
            
            // 星级筛选
            if (filters.star && filters.star !== 'all') {
                if (weapon.star !== filters.star) {
                    return false;
                }
            }
            
            // 类型筛选
            if (filters.type && filters.type !== 'all') {
                if (weapon.type !== filters.type) {
                    return false;
                }
            }
            
            // 属性筛选
            if (filters.baseAttr) {
                if (!weapon.baseAttr.includes(filters.baseAttr)) {
                    return false;
                }
            }
            
            if (filters.extraAttr) {
                if (!weapon.extraAttr.includes(filters.extraAttr)) {
                    return false;
                }
            }
            
            if (filters.skillAttr) {
                if (!weapon.skillAttr.includes(filters.skillAttr)) {
                    return false;
                }
            }
            
            return true;
        });
    }

    // 获取所有属性列表
    getAllAttributes() {
        const weapons = this.cache.get('weapons') || [];
        const locations = this.cache.get('locations') || [];
        
        const baseAttrs = new Set();
        const extraAttrs = new Set();
        const skillAttrs = new Set();
        
        // 从武器中收集属性
        weapons.forEach(weapon => {
            if (weapon.baseAttr) baseAttrs.add(weapon.baseAttr);
            if (weapon.extraAttr) extraAttrs.add(weapon.extraAttr);
            if (weapon.skillAttr) skillAttrs.add(weapon.skillAttr);
        });
        
        // 从地点中收集属性
        locations.forEach(location => {
            location.base.forEach(attr => baseAttrs.add(attr));
            location.extra.forEach(attr => extraAttrs.add(attr));
            location.skill.forEach(attr => skillAttrs.add(attr));
        });
        
        // 排序
        const sortAttrs = (attrs) => 
            Array.from(attrs).sort((a, b) => a.localeCompare(b, 'zh-CN'));
        
        return {
            baseAttrs: sortAttrs(baseAttrs),
            extraAttrs: sortAttrs(extraAttrs),
            skillAttrs: sortAttrs(skillAttrs)
        };
    }

    // 导出数据
    exportData(format = 'json') {
        const weapons = this.cache.get('weapons') || [];
        const locations = this.cache.get('locations') || [];
        const rules = this.cache.get('rules') || {};
        
        const data = {
            weapons,
            locations,
            rules,
            meta: {
                exportedAt: new Date().toISOString(),
                version: '1.0',
                totalWeapons: weapons.length,
                totalLocations: locations.length
            }
        };
        
        if (format === 'json') {
            return JSON.stringify(data, null, 2);
        } else if (format === 'csv') {
            // 简化的CSV导出
            let csv = '武器数据\n';
            csv += '名称,星级,类型,基础属性,附加属性,技能属性\n';
            weapons.forEach(weapon => {
                csv += `"${weapon.name}","${weapon.star}","${weapon.type}","${weapon.baseAttr}","${weapon.extraAttr}","${weapon.skillAttr}"\n`;
            });
            return csv;
        }
        
        return data;
    }

    // 清除缓存
    clearCache() {
        this.cache.clear();
        this.isLoaded = false;
        console.log('🗑️ 数据缓存已清除');
    }

    // 检查数据是否加载
    isDataLoaded() {
        return this.isLoaded;
    }

    // 获取加载状态
    getLoadStatus() {
        return {
            isLoaded: this.isLoaded,
            weaponsCount: (this.cache.get('weapons') || []).length,
            locationsCount: (this.cache.get('locations') || []).length,
            hasRules: !!this.cache.get('rules')
        };
    }
}

// 创建单例实例
const dataHandler = new DataHandler();

// 🔥 关键修复：将类导出到全局作用域
window.DataHandler = DataHandler;
window.dataHandler = dataHandler;

// 控制台提示
console.log('📊 DataHandler 已加载并注册到全局作用域');

// Node.js 环境导出（如果使用）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = dataHandler;
}