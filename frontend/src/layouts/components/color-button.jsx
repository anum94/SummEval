import { Iconify } from 'src/components/Iconify';
import IconButton from '@mui/material/IconButton';

import { useSettingsContext } from 'src/components/Settings/context';
import { useColorScheme } from '@mui/material/styles';

export function ColorButton({ sx, ...other }) {
  const settings = useSettingsContext();
  const { mode, setMode } = useColorScheme();


  return (
    <IconButton
      aria-label="colorMode"
      selected={settings.colorScheme === 'dark'}
      onClick={() => {
        settings.onUpdateField('colorScheme', mode === 'light' ? 'dark' : 'light');
        setMode(mode === 'light' ? 'dark' : 'light');
      }}
      sx={{ p: 0, width: 40, height: 40, ...sx }}
      {...other}
    >
        {
            mode === 'dark' ? (
                <Iconify icon='iconamoon:mode-light' />
            ) : (
                <Iconify icon='iconamoon:mode-dark' />
            )
        }
    </IconButton>
  );
}

// 

