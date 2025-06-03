import Alert from '@mui/material/Alert';

import { Main} from './main';
import { HeaderBase } from '../core/headerBase';
import { LayoutSection } from '../core/layoutSection';

export function SimpleLayout({ sx, children}) {

  const layoutQuery = 'md';

  return (
    <LayoutSection
      // Header
      headerSection={
        <HeaderBase
          layoutQuery={layoutQuery}
          slotsDisplay={{
            // all header icons a default true. To disable set them here to false e.g., logo: false
          }}
          slots={{
            topArea: (
              <Alert severity="info" sx={{ display: 'none', borderRadius: 0 }}>
                This is an info Alert.
              </Alert>
            ),
          }}
          slotProps={{ container: { maxWidth: false } }}
        />
      }
     
      // Footer
      footerSection={null}
      
      // Style
      cssVars={{
        '--layout-simple-content-compact-width': '448px',
      }}
      sx={sx}
    >
      <Main>{children}</Main>
    </LayoutSection>
  );
}