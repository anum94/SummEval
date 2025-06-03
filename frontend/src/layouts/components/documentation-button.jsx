import Button from '@mui/material/Button';
import { Iconify } from 'src/components/Iconify';
import { paths } from '/src/routes/paths';


export function DocumentationButton({ ...other }) {


  return (
    <Button
      fullWidth
      variant="soft"
      size="large"
      color="green"
      href={paths.documentation.root}
      {...other}
    >
      <Iconify icon="mdi:book-open-page-variant" sx={{ mr: 1 }} />
      Documentation
    </Button>
  );
}
