"""
生成测试数据脚本
"""
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models import User, Supplier, BOM, BOMItem, Quotation, QuotationItem, Contract
from datetime import datetime, timedelta
from decimal import Decimal


def generate_test_data(db: Session):
    """生成测试数据"""
    
    # 获取管理员用户（用于 created_by）
    admin_user = db.query(User).filter(User.username == "admin").first()
    if not admin_user:
        print("错误：未找到管理员用户，请先运行 init_db.py 初始化数据库")
        return
    
    user_id = admin_user.id
    
    # 1. 生成供应商数据
    print("正在生成供应商数据...")
    suppliers_data = [
        {
            "code": "SUP001",
            "name": "上海精密机械有限公司",
            "contact_person": "张经理",
            "contact_phone": "021-12345678",
            "contact_email": "zhang@shanghai-precision.com",
            "address": "上海市浦东新区科技路100号",
            "tax_id": "91310000123456789X",
            "bank_name": "中国工商银行上海分行",
            "bank_account": "6222021234567890123",
            "credit_rating": "AAA",
            "remark": "主要供应商，合作多年"
        },
        {
            "code": "SUP002",
            "name": "北京电子元器件有限公司",
            "contact_person": "李总",
            "contact_phone": "010-87654321",
            "contact_email": "li@beijing-electronics.com",
            "address": "北京市海淀区中关村大街1号",
            "tax_id": "91110000987654321Y",
            "bank_name": "中国建设银行北京分行",
            "bank_account": "6227001234567890123",
            "credit_rating": "AA",
            "remark": "电子元器件专业供应商"
        },
        {
            "code": "SUP003",
            "name": "深圳五金制品有限公司",
            "contact_person": "王经理",
            "contact_phone": "0755-11223344",
            "contact_email": "wang@shenzhen-hardware.com",
            "address": "深圳市南山区科技园南区",
            "tax_id": "91440300112233445Z",
            "bank_name": "招商银行深圳分行",
            "bank_account": "6225881234567890123",
            "credit_rating": "A",
            "remark": "五金配件供应商"
        },
        {
            "code": "SUP004",
            "name": "苏州塑料制品厂",
            "contact_person": "赵主任",
            "contact_phone": "0512-55667788",
            "contact_email": "zhao@suzhou-plastic.com",
            "address": "苏州市工业园区星海街200号",
            "tax_id": "91320500556677889A",
            "bank_name": "中国银行苏州分行",
            "bank_account": "6216601234567890123",
            "credit_rating": "AA",
            "remark": "塑料制品专业生产"
        },
        {
            "code": "SUP005",
            "name": "广州包装材料有限公司",
            "contact_person": "陈经理",
            "contact_phone": "020-99887766",
            "contact_email": "chen@guangzhou-packaging.com",
            "address": "广州市天河区天河路500号",
            "tax_id": "91440100998877665B",
            "bank_name": "中国农业银行广州分行",
            "bank_account": "6228481234567890123",
            "credit_rating": "A",
            "remark": "包装材料供应商"
        }
    ]
    
    suppliers = []
    for sup_data in suppliers_data:
        existing = db.query(Supplier).filter(Supplier.code == sup_data["code"]).first()
        if not existing:
            supplier = Supplier(**sup_data, created_by=user_id)
            db.add(supplier)
            suppliers.append(supplier)
        else:
            suppliers.append(existing)
    
    db.commit()
    print(f"已生成 {len(suppliers)} 个供应商")
    
    # 2. 生成BOM数据
    print("正在生成BOM数据...")
    boms_data = [
        {
            "code": "BOM001",
            "name": "环境监测设备A型 BOM清单",
            "product_name": "环境监测设备A型",
            "description": "用于大气环境监测的主设备",
            "status": "active",
            "items": [
                {"sequence": "1", "material_name": "堵头", "specification": "DN15, 304不锈钢", "unit": "套", "quantity": Decimal("9"), "unit_price": Decimal("2.50"), "remark": ""},
                {"sequence": "2", "material_name": "传感器", "specification": "PM2.5传感器", "unit": "个", "quantity": Decimal("2"), "unit_price": Decimal("150.00"), "remark": ""},
                {"sequence": "3", "material_name": "显示屏", "specification": "7寸触摸屏", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("200.00"), "remark": ""},
                {"sequence": "4", "material_name": "控制板", "specification": "主控板V2.0", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("350.00"), "remark": ""},
            ]
        },
        {
            "code": "BOM002",
            "name": "环境监测设备B型 BOM清单",
            "product_name": "环境监测设备B型",
            "description": "升级版环境监测设备",
            "status": "active",
            "items": [
                {"sequence": "1", "material_name": "堵头", "specification": "DN20, 316不锈钢", "unit": "套", "quantity": Decimal("12"), "unit_price": Decimal("3.00"), "remark": ""},
                {"sequence": "2", "material_name": "传感器", "specification": "PM2.5+PM10双传感器", "unit": "个", "quantity": Decimal("3"), "unit_price": Decimal("180.00"), "remark": ""},
                {"sequence": "3", "material_name": "显示屏", "specification": "10寸触摸屏", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("280.00"), "remark": ""},
                {"sequence": "4", "material_name": "控制板", "specification": "主控板V3.0", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("420.00"), "remark": ""},
                {"sequence": "5", "material_name": "外壳", "specification": "IP65防护等级", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("150.00"), "remark": ""},
            ]
        },
        {
            "code": "BOM003",
            "name": "便携式检测仪 BOM清单",
            "product_name": "便携式检测仪",
            "description": "手持式环境检测设备",
            "status": "draft",
            "items": [
                {"sequence": "1", "material_name": "传感器模块", "specification": "小型PM2.5传感器", "unit": "个", "quantity": Decimal("1"), "unit_price": Decimal("120.00"), "remark": ""},
                {"sequence": "2", "material_name": "显示屏", "specification": "3.5寸LCD屏", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("80.00"), "remark": ""},
                {"sequence": "3", "material_name": "电池", "specification": "锂电池3000mAh", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("50.00"), "remark": ""},
                {"sequence": "4", "material_name": "外壳", "specification": "ABS工程塑料", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("35.00"), "remark": ""},
            ]
        },
        {
            "code": "BOM004",
            "name": "固定式监测站 BOM清单",
            "product_name": "固定式监测站",
            "description": "大型固定监测站点设备",
            "status": "active",
            "items": [
                {"sequence": "1", "material_name": "主传感器", "specification": "多参数传感器组", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("5000.00"), "remark": ""},
                {"sequence": "2", "material_name": "数据采集器", "specification": "工业级数据采集", "unit": "台", "quantity": Decimal("1"), "unit_price": Decimal("3000.00"), "remark": ""},
                {"sequence": "3", "material_name": "通信模块", "specification": "4G通信模块", "unit": "个", "quantity": Decimal("1"), "unit_price": Decimal("800.00"), "remark": ""},
                {"sequence": "4", "material_name": "供电系统", "specification": "太阳能+市电双路", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("2500.00"), "remark": ""},
                {"sequence": "5", "material_name": "支架", "specification": "不锈钢支架3米", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("600.00"), "remark": ""},
            ]
        },
        {
            "code": "BOM005",
            "name": "水质监测设备 BOM清单",
            "product_name": "水质监测设备",
            "description": "水质参数监测设备",
            "status": "draft",
            "items": [
                {"sequence": "1", "material_name": "pH传感器", "specification": "工业级pH传感器", "unit": "个", "quantity": Decimal("1"), "unit_price": Decimal("800.00"), "remark": ""},
                {"sequence": "2", "material_name": "溶解氧传感器", "specification": "光学溶解氧传感器", "unit": "个", "quantity": Decimal("1"), "unit_price": Decimal("1200.00"), "remark": ""},
                {"sequence": "3", "material_name": "浊度传感器", "specification": "激光浊度传感器", "unit": "个", "quantity": Decimal("1"), "unit_price": Decimal("900.00"), "remark": ""},
                {"sequence": "4", "material_name": "控制器", "specification": "水质监测控制器", "unit": "台", "quantity": Decimal("1"), "unit_price": Decimal("2000.00"), "remark": ""},
            ]
        }
    ]
    
    boms = []
    for bom_data in boms_data:
        existing = db.query(BOM).filter(BOM.code == bom_data["code"]).first()
        if not existing:
            items_data = bom_data.pop("items")
            bom = BOM(**bom_data, created_by=user_id)
            db.add(bom)
            db.flush()
            
            total_amount = Decimal("0")
            for item_data in items_data:
                total_price = item_data["quantity"] * item_data["unit_price"]
                total_amount += total_price
                item = BOMItem(
                    bom_id=bom.id,
                    sequence=item_data["sequence"],
                    material_name=item_data["material_name"],
                    specification=item_data["specification"],
                    unit=item_data["unit"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    total_price=total_price,
                    remark=item_data.get("remark", "")
                )
                db.add(item)
            
            bom.total_amount = total_amount
            boms.append(bom)
        else:
            boms.append(existing)
    
    db.commit()
    print(f"已生成 {len(boms)} 个BOM")
    
    # 3. 生成报价单数据
    print("正在生成报价单数据...")
    quotations_data = [
        {
            "code": "QUO001",
            "supplier_id": suppliers[0].id,
            "bom_id": boms[0].id,
            "title": "环境监测设备A型报价单",
            "quotation_date": datetime.now() - timedelta(days=10),
            "valid_until": datetime.now() + timedelta(days=20),
            "delivery_days": 15,
            "status": "approved",
            "items": [
                {"sequence": "1", "material_name": "堵头", "specification": "DN15, 304不锈钢", "unit": "套", "quantity": Decimal("9"), "unit_price": Decimal("2.30"), "remark": ""},
                {"sequence": "2", "material_name": "传感器", "specification": "PM2.5传感器", "unit": "个", "quantity": Decimal("2"), "unit_price": Decimal("145.00"), "remark": ""},
                {"sequence": "3", "material_name": "显示屏", "specification": "7寸触摸屏", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("195.00"), "remark": ""},
                {"sequence": "4", "material_name": "控制板", "specification": "主控板V2.0", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("340.00"), "remark": ""},
            ]
        },
        {
            "code": "QUO002",
            "supplier_id": suppliers[1].id,
            "bom_id": boms[0].id,
            "title": "环境监测设备A型报价单（供应商2）",
            "quotation_date": datetime.now() - timedelta(days=8),
            "valid_until": datetime.now() + timedelta(days=22),
            "delivery_days": 12,
            "status": "submitted",
            "items": [
                {"sequence": "1", "material_name": "堵头", "specification": "DN15, 304不锈钢", "unit": "套", "quantity": Decimal("9"), "unit_price": Decimal("2.50"), "remark": ""},
                {"sequence": "2", "material_name": "传感器", "specification": "PM2.5传感器", "unit": "个", "quantity": Decimal("2"), "unit_price": Decimal("150.00"), "remark": ""},
                {"sequence": "3", "material_name": "显示屏", "specification": "7寸触摸屏", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("200.00"), "remark": ""},
                {"sequence": "4", "material_name": "控制板", "specification": "主控板V2.0", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("350.00"), "remark": ""},
            ]
        },
        {
            "code": "QUO003",
            "supplier_id": suppliers[0].id,
            "bom_id": boms[1].id,
            "title": "环境监测设备B型报价单",
            "quotation_date": datetime.now() - timedelta(days=5),
            "valid_until": datetime.now() + timedelta(days=25),
            "delivery_days": 20,
            "status": "draft",
            "items": [
                {"sequence": "1", "material_name": "堵头", "specification": "DN20, 316不锈钢", "unit": "套", "quantity": Decimal("12"), "unit_price": Decimal("3.20"), "remark": ""},
                {"sequence": "2", "material_name": "传感器", "specification": "PM2.5+PM10双传感器", "unit": "个", "quantity": Decimal("3"), "unit_price": Decimal("175.00"), "remark": ""},
                {"sequence": "3", "material_name": "显示屏", "specification": "10寸触摸屏", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("275.00"), "remark": ""},
                {"sequence": "4", "material_name": "控制板", "specification": "主控板V3.0", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("410.00"), "remark": ""},
                {"sequence": "5", "material_name": "外壳", "specification": "IP65防护等级", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("145.00"), "remark": ""},
            ]
        },
        {
            "code": "QUO004",
            "supplier_id": suppliers[2].id,
            "bom_id": boms[2].id,
            "title": "便携式检测仪报价单",
            "quotation_date": datetime.now() - timedelta(days=3),
            "valid_until": datetime.now() + timedelta(days=27),
            "delivery_days": 10,
            "status": "submitted",
            "items": [
                {"sequence": "1", "material_name": "传感器模块", "specification": "小型PM2.5传感器", "unit": "个", "quantity": Decimal("1"), "unit_price": Decimal("115.00"), "remark": ""},
                {"sequence": "2", "material_name": "显示屏", "specification": "3.5寸LCD屏", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("75.00"), "remark": ""},
                {"sequence": "3", "material_name": "电池", "specification": "锂电池3000mAh", "unit": "块", "quantity": Decimal("1"), "unit_price": Decimal("48.00"), "remark": ""},
                {"sequence": "4", "material_name": "外壳", "specification": "ABS工程塑料", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("32.00"), "remark": ""},
            ]
        },
        {
            "code": "QUO005",
            "supplier_id": suppliers[3].id,
            "bom_id": boms[3].id,
            "title": "固定式监测站报价单",
            "quotation_date": datetime.now() - timedelta(days=1),
            "valid_until": datetime.now() + timedelta(days=29),
            "delivery_days": 30,
            "status": "draft",
            "items": [
                {"sequence": "1", "material_name": "主传感器", "specification": "多参数传感器组", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("4800.00"), "remark": ""},
                {"sequence": "2", "material_name": "数据采集器", "specification": "工业级数据采集", "unit": "台", "quantity": Decimal("1"), "unit_price": Decimal("2900.00"), "remark": ""},
                {"sequence": "3", "material_name": "通信模块", "specification": "4G通信模块", "unit": "个", "quantity": Decimal("1"), "unit_price": Decimal("780.00"), "remark": ""},
                {"sequence": "4", "material_name": "供电系统", "specification": "太阳能+市电双路", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("2400.00"), "remark": ""},
                {"sequence": "5", "material_name": "支架", "specification": "不锈钢支架3米", "unit": "套", "quantity": Decimal("1"), "unit_price": Decimal("580.00"), "remark": ""},
            ]
        }
    ]
    
    quotations = []
    for quo_data in quotations_data:
        existing = db.query(Quotation).filter(Quotation.code == quo_data["code"]).first()
        if not existing:
            items_data = quo_data.pop("items")
            quotation = Quotation(**quo_data, created_by=user_id)
            db.add(quotation)
            db.flush()
            
            total_amount = Decimal("0")
            for item_data in items_data:
                total_price = item_data["quantity"] * item_data["unit_price"]
                total_amount += total_price
                item = QuotationItem(
                    quotation_id=quotation.id,
                    sequence=item_data["sequence"],
                    material_name=item_data["material_name"],
                    specification=item_data["specification"],
                    unit=item_data["unit"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    total_price=total_price,
                    remark=item_data.get("remark", "")
                )
                db.add(item)
            
            quotation.total_amount = total_amount
            quotations.append(quotation)
        else:
            quotations.append(existing)
    
    db.commit()
    print(f"已生成 {len(quotations)} 个报价单")
    
    # 4. 生成合同数据
    print("正在生成合同数据...")
    contracts_data = [
        {
            "code": "CON001",
            "title": "环境监测设备A型采购合同",
            "supplier_id": suppliers[0].id,
            "quotation_id": quotations[0].id,
            "bom_id": boms[0].id,
            "contract_type": "采购合同",
            "sign_date": datetime.now() - timedelta(days=5),
            "start_date": datetime.now() - timedelta(days=5),
            "end_date": datetime.now() + timedelta(days=25),
            "total_amount": Decimal("682.50"),
            "status": "active",
            "payment_terms": "合同签订后支付30%，交货验收后支付60%，质保期满支付10%",
            "delivery_terms": "FOB上海，15个工作日内交货",
            "remark": "首批订单"
        },
        {
            "code": "CON002",
            "title": "环境监测设备B型采购合同",
            "supplier_id": suppliers[0].id,
            "quotation_id": quotations[2].id,
            "bom_id": boms[1].id,
            "contract_type": "采购合同",
            "sign_date": datetime.now() - timedelta(days=2),
            "start_date": datetime.now() - timedelta(days=2),
            "end_date": datetime.now() + timedelta(days=28),
            "total_amount": Decimal("1525.40"),
            "status": "active",
            "payment_terms": "合同签订后支付40%，交货验收后支付50%，质保期满支付10%",
            "delivery_terms": "FOB上海，20个工作日内交货",
            "remark": "升级版设备"
        },
        {
            "code": "CON003",
            "title": "便携式检测仪采购合同",
            "supplier_id": suppliers[2].id,
            "quotation_id": quotations[3].id,
            "bom_id": boms[2].id,
            "contract_type": "采购合同",
            "sign_date": datetime.now() - timedelta(days=1),
            "start_date": datetime.now() - timedelta(days=1),
            "end_date": datetime.now() + timedelta(days=29),
            "total_amount": Decimal("270.00"),
            "status": "draft",
            "payment_terms": "合同签订后支付50%，交货验收后支付50%",
            "delivery_terms": "FOB深圳，10个工作日内交货",
            "remark": "小批量试产"
        },
        {
            "code": "CON004",
            "title": "固定式监测站采购合同",
            "supplier_id": suppliers[3].id,
            "quotation_id": quotations[4].id,
            "bom_id": boms[3].id,
            "contract_type": "采购合同",
            "sign_date": datetime.now(),
            "start_date": datetime.now(),
            "end_date": datetime.now() + timedelta(days=30),
            "total_amount": Decimal("11460.00"),
            "status": "draft",
            "payment_terms": "合同签订后支付30%，设备安装调试后支付50%，验收合格后支付20%",
            "delivery_terms": "FOB苏州，30个工作日内交货",
            "remark": "大型项目订单"
        },
        {
            "code": "CON005",
            "title": "环境监测设备A型补充合同",
            "supplier_id": suppliers[0].id,
            "quotation_id": quotations[0].id,
            "bom_id": boms[0].id,
            "contract_type": "补充合同",
            "sign_date": datetime.now() - timedelta(days=30),
            "start_date": datetime.now() - timedelta(days=30),
            "end_date": datetime.now() - timedelta(days=5),
            "total_amount": Decimal("682.50"),
            "status": "completed",
            "payment_terms": "合同签订后支付30%，交货验收后支付60%，质保期满支付10%",
            "delivery_terms": "FOB上海，15个工作日内交货",
            "remark": "已完成订单"
        }
    ]
    
    contracts = []
    for con_data in contracts_data:
        existing = db.query(Contract).filter(Contract.code == con_data["code"]).first()
        if not existing:
            contract = Contract(**con_data, created_by=user_id)
            db.add(contract)
            contracts.append(contract)
        else:
            contracts.append(existing)
    
    db.commit()
    print(f"已生成 {len(contracts)} 个合同")
    
    print("\n" + "=" * 50)
    print("测试数据生成完成！")
    print("=" * 50)
    print(f"供应商: {len(suppliers)} 个")
    print(f"BOM: {len(boms)} 个")
    print(f"报价单: {len(quotations)} 个")
    print(f"合同: {len(contracts)} 个")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        generate_test_data(db)
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

