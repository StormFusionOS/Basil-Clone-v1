import { DataGrid, GridColDef, GridRenderCellParams, GridRowModel } from '@mui/x-data-grid';
import { Box, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { useMemo } from 'react';

export interface LineItemRow {
  id: string;
  sku: string;
  title: string;
  qty: number;
  price: number;
  discount: number;
  overrideReason?: string;
}

export interface DataGridLineEditorProps {
  rows: LineItemRow[];
  onRowsChange: (rows: LineItemRow[]) => void;
  onRemove: (id: string) => void;
  editable?: boolean;
  activeRowId?: string | null;
  onActiveRowChange?: (id: string | null) => void;
}

export const DataGridLineEditor = ({
  rows,
  onRowsChange,
  onRemove,
  editable = true,
  activeRowId,
  onActiveRowChange
}: DataGridLineEditorProps) => {
  const columns = useMemo<GridColDef[]>(
    () => [
      { field: 'sku', headerName: 'SKU', width: 140 },
      { field: 'title', headerName: 'Title', flex: 1, minWidth: 200 },
      {
        field: 'qty',
        headerName: 'Qty',
        width: 80,
        editable,
        type: 'number'
      },
      {
        field: 'price',
        headerName: 'Price',
        width: 120,
        editable,
        valueFormatter: params => `$${Number(params.value ?? 0).toFixed(2)}`
      },
      {
        field: 'discount',
        headerName: 'Discount',
        width: 120,
        editable,
        valueFormatter: params => `$${Number(params.value ?? 0).toFixed(2)}`
      },
      {
        field: 'overrideReason',
        headerName: 'Override Reason',
        flex: 0.6,
        minWidth: 140,
        editable
      },
      {
        field: 'actions',
        headerName: '',
        sortable: false,
        filterable: false,
        width: 72,
        renderCell: (params: GridRenderCellParams) => (
          <IconButton
            size="small"
            onClick={() => onRemove(params.row.id as string)}
            aria-label={`Remove ${params.row.title}`}
            color="error"
          >
            <DeleteIcon />
          </IconButton>
        )
      }
    ],
    [editable, onRemove]
  );

  const handleProcessRowUpdate = (updatedRow: GridRowModel) => {
    const nextRows = rows.map(row => (row.id === updatedRow.id ? { ...row, ...updatedRow } : row));
    onRowsChange(nextRows as LineItemRow[]);
    return updatedRow;
  };

  return (
    <Box sx={{ height: '100%', '.MuiDataGrid-root': { border: 'none' } }}>
      <DataGrid
        rows={rows}
        columns={columns}
        hideFooter
        sx={{ bgcolor: 'background.paper' }}
        processRowUpdate={handleProcessRowUpdate}
        experimentalFeatures={{ newEditingApi: true }}
        editMode="row"
        rowSelectionModel={activeRowId ? [activeRowId] : []}
        onRowSelectionModelChange={selection =>
          onActiveRowChange?.(selection.length ? (selection[0] as string) : null)
        }
        onCellClick={params => onActiveRowChange?.(params.row.id as string)}
      />
    </Box>
  );
};
