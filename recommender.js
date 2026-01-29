class MatrixRecommender {
    constructor(weapons, locations, rules) {
        this.weapons = weapons;
        this.locations = locations;
        this.rules = rules;
        
        // 建立索引
        this.weaponMap = new Map();
        weapons.forEach(weapon => {
            this.weaponMap.set(weapon.name, weapon);
        });
        
        this.locationMap = new Map();
        locations.forEach(location => {
            this.locationMap.set(location.name, location);
        });
    }

    // 获取武器属性
    getWeaponProperties(weaponName) {
        const weapon = this.weaponMap.get(weaponName);
        if (!weapon) {
            throw new Error(`武器 ${weaponName} 不存在`);
        }
        return weapon;
    }

    // 搜索武器（文本搜索）
    searchWeaponsByText(baseAttr = "", extraAttr = "", skillAttr = "") {
        const matches = [];
        
        for (const weapon of this.weapons) {
            let match = true;
            
            if (baseAttr && !weapon.baseAttr.includes(baseAttr)) {
                match = false;
            }
            
            if (extraAttr && !weapon.extraAttr.includes(extraAttr)) {
                match = false;
            }
            
            if (skillAttr && !weapon.skillAttr.includes(skillAttr)) {
                match = false;
            }
            
            if (match) {
                matches.push(weapon.name);
            }
        }
        
        return matches;
    }

    // 分析武器属性
    analyzeWeaponsAttributes(weaponNames) {
        const baseCounter = new Map();
        const extraCounter = new Map();
        const skillCounter = new Map();
        
        for (const weaponName of weaponNames) {
            const weapon = this.weaponMap.get(weaponName);
            if (!weapon) continue;
            
            // 基础属性统计
            if (weapon.baseAttr) {
                baseCounter.set(weapon.baseAttr, (baseCounter.get(weapon.baseAttr) || 0) + 1);
            }
            
            // 附加属性统计
            if (weapon.extraAttr) {
                extraCounter.set(weapon.extraAttr, (extraCounter.get(weapon.extraAttr) || 0) + 1);
            }
            
            // 技能属性统计
            if (weapon.skillAttr) {
                skillCounter.set(weapon.skillAttr, (skillCounter.get(weapon.skillAttr) || 0) + 1);
            }
        }
        
        return {
            base: Object.fromEntries(baseCounter),
            extra: Object.fromEntries(extraCounter),
            skill: Object.fromEntries(skillCounter)
        };
    }

    // 推荐地点
    recommendLocations(weaponNames, lockedWeapons = []) {
        if (!weaponNames.length || !this.locations.length) {
            return [];
        }
        
        const weaponProperties = weaponNames.map(name => this.getWeaponProperties(name));
        const locationScores = [];
        
        for (const location of this.locations) {
            const score = this.calculateLocationScore(location, weaponProperties);
            const coverage = this.calculateCoverage(location, weaponProperties);
            
            // 如果有锁定武器，计算额外分数
            let lockedScore = 0;
            if (lockedWeapons.length > 0) {
                const lockedProperties = lockedWeapons.map(name => this.getWeaponProperties(name));
                const tempScore = this.calculateLocationScore(location, lockedProperties);
                lockedScore = tempScore * 2; // 锁定武器权重加倍
            }
            
            const totalScore = score + lockedScore;
            
            locationScores.push({
                location: location.name,
                score: totalScore,
                coverage: coverage,
                matched: this.getMatchedProperties(location, weaponProperties)
            });
        }
        
        // 按分数排序
        locationScores.sort((a, b) => b.score - a.score);
        return locationScores;
    }

    // 计算地点分数
    calculateLocationScore(location, weaponProperties) {
        let score = 0;
        
        for (const weapon of weaponProperties) {
            if (location.base.includes(weapon.baseAttr)) {
                score += 3;
            }
            
            if (location.extra.includes(weapon.extraAttr)) {
                score += 2;
            }
            
            if (location.skill.includes(weapon.skillAttr)) {
                score += 2;
            }
        }
        
        return score;
    }

    // 计算覆盖率
    calculateCoverage(location, weaponProperties) {
        let matchedCount = 0;
        let totalCount = weaponProperties.length * 3;
        
        for (const weapon of weaponProperties) {
            if (location.base.includes(weapon.baseAttr)) {
                matchedCount++;
            }
            
            if (location.extra.includes(weapon.extraAttr)) {
                matchedCount++;
            }
            
            if (location.skill.includes(weapon.skillAttr)) {
                matchedCount++;
            }
        }
        
        return totalCount > 0 ? matchedCount / totalCount : 0;
    }

    // 获取匹配的属性
    getMatchedProperties(location, weaponProperties) {
        const matched = {
            base: 0,
            extra: 0,
            skill: 0
        };
        
        for (const weapon of weaponProperties) {
            if (location.base.includes(weapon.baseAttr)) {
                matched.base++;
            }
            
            if (location.extra.includes(weapon.extraAttr)) {
                matched.extra++;
            }
            
            if (location.skill.includes(weapon.skillAttr)) {
                matched.skill++;
            }
        }
        
        return matched;
    }

    // 推荐预刻写属性
    recommendEngravingAttributes(weaponNames, lockedWeapons, locationName) {
        const location = this.locationMap.get(locationName);
        if (!location) {
            return null;
        }
        
        const weaponProperties = weaponNames.map(name => this.getWeaponProperties(name));
        const lockedProperties = lockedWeapons.map(name => this.getWeaponProperties(name));
        
        // 分析属性出现频率
        const attributeAnalysis = this.analyzeWeaponsAttributes(weaponNames);
        const lockedAnalysis = this.analyzeWeaponsAttributes(lockedWeapons);
        
        // 推荐基础属性（最多3条）
        const recommendedBaseAttrs = this.recommendBaseAttributes(
            location.base,
            attributeAnalysis.base,
            lockedAnalysis.base
        );
        
        // 推荐附加/技能属性（1条）
        const recommendedExtraSkill = this.recommendExtraOrSkill(
            location,
            attributeAnalysis,
            lockedAnalysis
        );
        
        return {
            baseAttributes: recommendedBaseAttrs,
            attribute: recommendedExtraSkill.attribute,
            attributeType: recommendedExtraSkill.type
        };
    }

    // 推荐基础属性
    recommendBaseAttributes(availableBase, baseAnalysis, lockedBaseAnalysis) {
        const recommended = [];
        
        // 优先考虑锁定武器的属性
        if (lockedBaseAnalysis && Object.keys(lockedBaseAnalysis).length > 0) {
            const lockedAttrs = Object.entries(lockedBaseAnalysis)
                .filter(([attr]) => availableBase.includes(attr))
                .sort((a, b) => b[1] - a[1]);
            
            for (const [attr] of lockedAttrs.slice(0, 3)) {
                if (!recommended.includes(attr)) {
                    recommended.push(attr);
                }
            }
        }
        
        // 如果不够3条，补充所有武器的属性
        if (recommended.length < 3 && baseAnalysis) {
            const allAttrs = Object.entries(baseAnalysis)
                .filter(([attr]) => availableBase.includes(attr) && !recommended.includes(attr))
                .sort((a, b) => b[1] - a[1]);
            
            for (const [attr] of allAttrs) {
                if (recommended.length >= 3) break;
                recommended.push(attr);
            }
        }
        
        // 如果还不够，从可用属性中补充
        if (recommended.length < 3) {
            const remainingAttrs = availableBase.filter(attr => !recommended.includes(attr));
            for (const attr of remainingAttrs) {
                if (recommended.length >= 3) break;
                recommended.push(attr);
            }
        }
        
        return recommended.slice(0, 3);
    }

    // 推荐附加或技能属性
    recommendExtraOrSkill(location, attributeAnalysis, lockedAnalysis) {
        const { extra, skill } = attributeAnalysis;
        const lockedExtra = lockedAnalysis?.extra || {};
        const lockedSkill = lockedAnalysis?.skill || {};
        
        // 优先考虑锁定武器的属性
        const bestLockedExtra = this.getBestAttribute(location.extra, lockedExtra);
        const bestLockedSkill = this.getBestAttribute(location.skill, lockedSkill);
        
        if (bestLockedExtra.count > 0 || bestLockedSkill.count > 0) {
            // 根据规则：技能属性出现频率 ≥ 附加属性时，优先技能属性
            if (bestLockedSkill.count >= bestLockedExtra.count) {
                return {
                    attribute: bestLockedSkill.attr,
                    type: '技能属性'
                };
            } else {
                return {
                    attribute: bestLockedExtra.attr,
                    type: '附加属性'
                };
            }
        }
        
        // 如果没有锁定武器属性，使用所有武器的属性
        const bestExtra = this.getBestAttribute(location.extra, extra);
        const bestSkill = this.getBestAttribute(location.skill, skill);
        
        if (bestExtra.count > 0 || bestSkill.count > 0) {
            if (bestSkill.count >= bestExtra.count) {
                return {
                    attribute: bestSkill.attr,
                    type: '技能属性'
                };
            } else {
                return {
                    attribute: bestExtra.attr,
                    type: '附加属性'
                };
            }
        }
        
        // 如果仍然没有，选择任意可用属性
        if (location.extra.length > 0) {
            return {
                attribute: location.extra[0],
                type: '附加属性'
            };
        } else if (location.skill.length > 0) {
            return {
                attribute: location.skill[0],
                type: '技能属性'
            };
        }
        
        return {
            attribute: '',
            type: ''
        };
    }

    // 获取最佳属性
    getBestAttribute(availableAttrs, attributeCounter) {
        let bestAttr = '';
        let bestCount = 0;
        
        for (const [attr, count] of Object.entries(attributeCounter)) {
            if (availableAttrs.includes(attr) && count > bestCount) {
                bestAttr = attr;
                bestCount = count;
            }
        }
        
        return {
            attr: bestAttr,
            count: bestCount
        };
    }
}