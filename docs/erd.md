# BookForge POS Data Model

```mermaid
erDiagram
  ORGANIZATIONS {
    string id PK
    string name
    datetime created_at
    datetime updated_at
  }
  STORES {
    string id PK
    string org_id FK
    string name
    datetime created_at
    datetime updated_at
  }
  USERS {
    string id PK
    string org_id FK
    string store_id FK
    string email
    string name
    string role
    string password_hash
    datetime created_at
    datetime updated_at
  }
  TITLES {
    string isbn13 PK
    string title
    string subtitle
    string[] authors
    string publisher
    datetime pub_date
    string binding
    int msrp_cents
    string[] subjects
    string edition
    string language
    string dimensions
    string weight
  }
  ITEMS {
    string id PK
    string isbn13 FK
    string condition
    boolean signed
    boolean first_edition
    string notes
    boolean taxable
    string sku_override
    datetime created_at
    datetime updated_at
  }
  LOCATIONS {
    string id PK
    string store_id FK
    string name
    string path
  }
  INVENTORY {
    string item_id PK
    string store_id PK FK
    int qty_on_hand
    int qty_reserved
    string bin
    datetime updated_at
  }
  STOCK_MOVEMENTS {
    string id PK
    string item_id FK
    string store_id FK
    string type
    int qty
    string ref_type
    string ref_id
    string user_id
    datetime ts
  }
  CUSTOMERS {
    string id PK
    string name
    string email
    string phone
    boolean marketing_opt_in
    int store_credit_cents
    int loyalty_points
    datetime created_at
    datetime updated_at
  }
  ORDERS {
    string id PK
    string store_id FK
    string customer_id FK
    string status
    int subtotal_cents
    int tax_cents
    int discount_cents
    int total_cents
    int store_credit_applied_cents
    int loyalty_points_awarded
    datetime created_at
    datetime updated_at
  }
  STORE_CREDIT_ISSUANCES {
    string id PK
    string customer_id FK
    int amount_cents
    string reason
    string issued_by
    datetime created_at
  }
  STORE_CREDIT_REDEMPTIONS {
    string id PK
    string customer_id FK
    string order_id FK
    int amount_cents
    int loyalty_points_used
    string redeemed_by
    datetime created_at
  }
  ORDER_LINES {
    string id PK
    string order_id FK
    string item_id FK
    int qty
    int price_cents
    int discount_cents
    int tax_cents
  }
  PAYMENTS {
    string id PK
    string order_id FK
    string method
    string external_txn_id
    int amount_cents
    string status
    datetime ts
  }
  VENDORS {
    string id PK
    string name
    string account_num
    string edi_qualifier
    string edi_id
    string payment_terms
    string contact
  }
  PURCHASE_ORDERS {
    string id PK
    string vendor_id FK
    string store_id FK
    string status
    datetime created_at
  }
  PO_LINES {
    string id PK
    string po_id FK
    string isbn13 FK
    int ordered_qty
    int received_qty
    int cost_cents
  }
  RECEIPTS {
    string id PK
    string po_id FK
    datetime ts
    string received_by
  }
  REORDER_RULES {
    string id PK
    string item_id FK
    string store_id FK
    int min
    int max
    int lead_time_days
  }
  CHANNELS {
    string id PK
    string kind
    string credentials_ref
    boolean enabled
  }
  LISTINGS {
    string id PK
    string item_id FK
    string channel_id FK
    string sku
    int price_cents
    string state
    datetime last_synced_at
    string error_message
  }
  REQUESTS {
    string id PK
    string customer_id FK
    string isbn13 FK
    string title
    string author
    string status
    datetime created_at
  }
  CONSIGNORS {
    string id PK
    string name
    int split_percent
    string settlement_terms
  }
  CONSIGNOR_ITEMS {
    string id PK
    string consignor_id FK
    string item_id FK
    int split_percent_override
  }

  ORGANIZATIONS ||--o{ STORES : owns
  ORGANIZATIONS ||--o{ USERS : employs
  STORES ||--o{ USERS : assigns
  STORES ||--o{ LOCATIONS : houses
  STORES ||--o{ INVENTORY : stocks
  STORES ||--o{ STOCK_MOVEMENTS : tracks
  STORES ||--o{ ORDERS : fulfills
  STORES ||--o{ PURCHASE_ORDERS : purchases
  STORES ||--o{ REORDER_RULES : governs
  TITLES ||--o{ ITEMS : contains
  TITLES ||--o{ LISTINGS : references
  TITLES ||--o{ PO_LINES : supplied
  TITLES ||--o{ REQUESTS : requested
  ITEMS ||--o{ INVENTORY : stocked
  ITEMS ||--o{ STOCK_MOVEMENTS : moves
  ITEMS ||--o{ ORDER_LINES : fulfills
  ITEMS ||--o{ LISTINGS : listed
  ITEMS ||--o{ REORDER_RULES : thresholds
  ITEMS ||--o{ CONSIGNOR_ITEMS : consigned
  CUSTOMERS ||--o{ ORDERS : placed
  CUSTOMERS ||--o{ REQUESTS : submits
  CUSTOMERS ||--o{ STORE_CREDIT_ISSUANCES : credited
  CUSTOMERS ||--o{ STORE_CREDIT_REDEMPTIONS : debited
  ORDERS ||--o{ ORDER_LINES : contains
  ORDERS ||--o{ PAYMENTS : paid_with
  ORDERS ||--o{ STORE_CREDIT_REDEMPTIONS : consumes
  VENDORS ||--o{ PURCHASE_ORDERS : supply
  PURCHASE_ORDERS ||--o{ PO_LINES : detail
  PURCHASE_ORDERS ||--o{ RECEIPTS : received
  CHANNELS ||--o{ LISTINGS : publishes
  CONSIGNORS ||--o{ CONSIGNOR_ITEMS : owns
```
