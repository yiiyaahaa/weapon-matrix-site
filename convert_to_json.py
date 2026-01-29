# convert_to_json.py
import json
import os

def convert_weapons():
    with open('data/武器.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    weapons = []
    for i, line in enumerate(lines, 1):
        line = line.strip()
        if not line:
            continue
            
        # 解析武器数据
        if '：' in line:
            name_part, attr_part = line.split('：', 1)
        elif ':' in line:
            name_part, attr_part = line.split(':', 1)
        else:
            continue
        
        # 提取武器信息
        star_rating = "未知"
        weapon_type = "未知"
        
        if '（' in name_part and '）' in name_part:
            start = name_part.find('（')
            end = name_part.find('）')
            if start != -1 and end != -1:
                info = name_part[start+1:end]
                # 提取星级
                if '六星' in info:
                    star_rating = "六星"
                elif '五星' in info:
                    star_rating = "五星"
                elif '四星' in info:
                    star_rating = "四星"
                elif '三星' in info:
                    star_rating = "三星"
                # 提取类型
                if '单手剑' in info:
                    weapon_type = "单手剑"
                elif '双手剑' in info:
                    weapon_type = "双手剑"
                elif '长柄武器' in info:
                    weapon_type = "长柄武器"
                elif '手铳' in info:
                    weapon_type = "手铳"
                elif '施术单元' in info:
                    weapon_type = "施术单元"
        
        # 提取属性
        attrs = [attr.strip() for attr in attr_part.split('、')]
        base_attr = attrs[0] if len(attrs) > 0 else ""
        extra_attr = attrs[1] if len(attrs) > 1 else ""
        skill_attr = attrs[2] if len(attrs) > 2 else ""
        
        weapons.append({
            "id": i,
            "name": name_part.strip(),
            "baseAttr": base_attr,
            "extraAttr": extra_attr,
            "skillAttr": skill_attr,
            "star": star_rating,
            "type": weapon_type
        })
    
    with open('data/weapons.json', 'w', encoding='utf-8') as f:
        json.dump(weapons, f, ensure_ascii=False, indent=2)

def convert_locations():
    with open('data/地点.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    locations = []
    sections = content.strip().split('\n\n')
    
    for section in sections:
        lines = section.strip().split('\n')
        if not lines:
            continue
            
        location_name = lines[0].strip()
        location_data = {
            "name": location_name,
            "base": [],
            "extra": [],
            "skill": []
        }
        
        for line in lines[1:]:
            line = line.strip()
            if not line:
                continue
                
            if '：' in line:
                attr_type, attrs = line.split('：', 1)
            elif ':' in line:
                attr_type, attrs = line.split(':', 1)
            else:
                continue
            
            attr_type = attr_type.strip()
            attrs_list = [attr.strip() for attr in attrs.split('、')]
            
            if attr_type == '基础属性':
                location_data["base"] = attrs_list
            elif attr_type == '附加属性':
                location_data["extra"] = attrs_list
            elif attr_type == '技能属性':
                location_data["skill"] = attrs_list
        
        locations.append(location_data)
    
    with open('data/locations.json', 'w', encoding='utf-8') as f:
        json.dump(locations, f, ensure_ascii=False, indent=2)

def convert_rules():
    with open('data/规则.txt', 'r', encoding='utf-8') as f:
        content = f.read()
    
    rules = {
        "content": content,
        "version": "1.0",
        "updated": "2024-01"
    }
    
    with open('data/rules.json', 'w', encoding='utf-8') as f:
        json.dump(rules, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    # 确保data目录存在
    os.makedirs('data', exist_ok=True)
    
    # 转换数据
    convert_weapons()
    convert_locations()
    convert_rules()
    
    print("数据转换完成！")