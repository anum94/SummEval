import { CompactContent } from './main';
import { LayoutSection } from '../core/layoutSection';


export function BasicLayout({ sx, children, content }) {

  const layoutQuery = 'md';

  return (
    <LayoutSection
      /** **************************************
       * Header
       *************************************** */
      headerSection={null}
      /** **************************************
       * Footer
       *************************************** */
      footerSection={null}
      /** **************************************
       * Style
       *************************************** */
      cssVars={{
        '--layout-simple-content-compact-width': '448px',
      }}
      sx={sx}
    >
      <CompactContent>{children}</CompactContent>
    </LayoutSection>
  );
}
