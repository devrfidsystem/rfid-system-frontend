import os
import re

def fix_fe_lint():
    fe_dir = "/Users/syillaeltaniadaffa/Documents/Warehouse/src"
    
    # NotificationDrawer.vue
    f1 = os.path.join(fe_dir, "components/organisms/NotificationDrawer.vue")
    if os.path.exists(f1):
        with open(f1, "r") as f: content = f.read()
        content = content.replace("v-for=\"(activity, index) in activities\"", "v-for=\"activity in activities\"")
        content = content.replace("ArrowUpFromLine,\n", "")
        content = content.replace("Package,\n", "")
        with open(f1, "w") as f: f.write(content)

    # DashboardPage.vue
    f2 = os.path.join(fe_dir, "views/dashboard/DashboardPage.vue")
    if os.path.exists(f2):
        with open(f2, "r") as f: content = f.read()
        content = content.replace("(activity, index)", "activity")
        content = re.sub(r'Clock,\s*', '', content)
        content = re.sub(r'Filter,\s*', '', content)
        content = re.sub(r'Settings,\s*', '', content)
        content = re.sub(r'Plus,\s*', '', content)
        with open(f2, "w") as f: f.write(content)

    # TagRegistrationPage.vue (log)
    f3 = os.path.join(fe_dir, "views/log/TagRegistrationPage.vue")
    if os.path.exists(f3):
        with open(f3, "r") as f: content = f.read()
        content = re.sub(r'Tags,\s*', '', content)
        with open(f3, "w") as f: f.write(content)

    # TrackingPage.vue
    f4 = os.path.join(fe_dir, "views/log/TrackingPage.vue")
    if os.path.exists(f4):
        with open(f4, "r") as f: content = f.read()
        content = re.sub(r'Radar,\s*', '', content)
        with open(f4, "w") as f: f.write(content)

    # MasterEntityPage.vue
    f5 = os.path.join(fe_dir, "views/master/MasterEntityPage.vue")
    if os.path.exists(f5):
        with open(f5, "r") as f: content = f.read()
        content = content.replace("(row, rIdx)", "row")
        with open(f5, "w") as f: f.write(content)

    # RfidEventPage.vue
    f6 = os.path.join(fe_dir, "views/rfid/RfidEventPage.vue")
    if os.path.exists(f6):
        with open(f6, "r") as f: content = f.read()
        content = re.sub(r'Activity,\s*', '', content)
        with open(f6, "w") as f: f.write(content)

    # StockLedgerPage.vue
    f7 = os.path.join(fe_dir, "views/stock/StockLedgerPage.vue")
    if os.path.exists(f7):
        with open(f7, "r") as f: content = f.read()
        content = re.sub(r'Radar,\s*', '', content)
        with open(f7, "w") as f: f.write(content)

    # TagRegistrationPage.vue (tag-registration)
    f8 = os.path.join(fe_dir, "views/tag-registration/pages/TagRegistrationPage.vue")
    if os.path.exists(f8):
        with open(f8, "r") as f: content = f.read()
        content = re.sub(r'Tags,\s*', '', content)
        with open(f8, "w") as f: f.write(content)

    # TransactionListPage.vue
    f9 = os.path.join(fe_dir, "views/transactions/TransactionListPage.vue")
    if os.path.exists(f9):
        with open(f9, "r") as f: content = f.read()
        content = re.sub(r'Activity,\s*', '', content)
        with open(f9, "w") as f: f.write(content)
        
    print("FE lint issues fixed")

def fix_be_lint():
    be_dir = "/Users/syillaeltaniadaffa/Documents/Warehouse-be/src"
    
    def replace_any(filepath):
        if os.path.exists(filepath):
            with open(filepath, "r") as f: content = f.read()
            content = content.replace(": any", ": unknown")
            with open(filepath, "w") as f: f.write(content)

    # BE files
    files = [
        "modules/warehouse/customers/customers.service.ts",
        "modules/warehouse/dashboard/dashboard.service.ts",
        "modules/warehouse/product-categories/product-categories.service.ts",
        "modules/warehouse/products/products.service.ts",
        "modules/warehouse/suppliers/suppliers.service.ts",
        "modules/warehouse/uoms/uoms.service.ts"
    ]
    for fp in files:
        replace_any(os.path.join(be_dir, fp))

    # unused vars in BE
    dash = os.path.join(be_dir, "modules/warehouse/dashboard/dashboard.service.ts")
    if os.path.exists(dash):
        with open(dash, "r") as f: content = f.read()
        content = content.replace("_query: unknown", "/* _query */")
        content = content.replace("_query: any", "/* _query */")
        with open(dash, "w") as f: f.write(content)

    prod = os.path.join(be_dir, "modules/warehouse/products/products.service.ts")
    if os.path.exists(prod):
        with open(prod, "r") as f: content = f.read()
        content = content.replace("_actor?: string", "/* _actor?: string */")
        with open(prod, "w") as f: f.write(content)

    stock = os.path.join(be_dir, "modules/warehouse/stock/stock.service.ts")
    if os.path.exists(stock):
        with open(stock, "r") as f: content = f.read()
        content = content.replace("export interface StockLedgerFilter extends PaginationQuery {}", "export interface StockLedgerFilter extends PaginationQuery { [key: string]: unknown }")
        with open(stock, "w") as f: f.write(content)

    print("BE lint issues fixed")

fix_fe_lint()
fix_be_lint()
