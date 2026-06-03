import re

file_path = '/Users/syillaeltaniadaffa/Documents/Warehouse/src/api/feature/dto/master.dto.ts'
with open(file_path, 'r') as f:
    content = f.read()

# Remove imports
content = re.sub(r'\s*CustomerRecord,\n?', '\n', content)
content = re.sub(r'\s*SupplierRecord,\n?', '\n', content)

# Remove from MasterEntityKey
content = re.sub(r'\s*\|\s*\'customers\'\n?', '\n', content)
content = re.sub(r'\s*\|\s*\'suppliers\'\n?', '\n', content)

# Remove payload interfaces
content = re.sub(r'export interface CreateCustomerPayload[\s\S]*?\}\n+', '', content)
content = re.sub(r'export type UpdateCustomerPayload[\s\S]*?;\n+', '', content)
content = re.sub(r'export interface CreateSupplierPayload[\s\S]*?\}\n+', '', content)
content = re.sub(r'export type UpdateSupplierPayload[\s\S]*?;\n+', '', content)

# Remove from MasterCreatePayloads
content = re.sub(r'\s*customers: CreateCustomerPayload;\n?', '\n', content)
content = re.sub(r'\s*suppliers: CreateSupplierPayload;\n?', '\n', content)

# Remove from MasterUpdatePayloads
content = re.sub(r'\s*customers: UpdateCustomerPayload;\n?', '\n', content)
content = re.sub(r'\s*suppliers: UpdateSupplierPayload;\n?', '\n', content)

# Remove from MasterRecords
content = re.sub(r'\s*customers: CustomerRecord;\n?', '\n', content)
content = re.sub(r'\s*suppliers: SupplierRecord;\n?', '\n', content)

with open(file_path, 'w') as f:
    f.write(content)

print("Removed customers and suppliers from master.dto.ts")
