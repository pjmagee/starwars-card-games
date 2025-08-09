import React from 'react';
import {
  Nav,
  NavItem,
  NavCategory,
  NavCategoryItem,
  NavSubItem,
  makeStyles,
  tokens,
} from '@fluentui/react-components';
import {
  Games24Regular,
  CardUi24Regular,
  Group24Regular,
} from '@fluentui/react-icons';

interface AppNavigationProps {
  currentGame: string;
  onGameSelect: (game: 'menu' | 'pazaak' | 'pazaak-multiplayer' | 'pazaak-rules') => void;
}

const useStyles = makeStyles({
  nav: {
    width: '250px',
    backgroundColor: tokens.colorNeutralBackground2,
    borderRight: `1px solid ${tokens.colorNeutralStroke1}`,
  },
});

const AppNavigation: React.FC<AppNavigationProps> = ({ 
  onGameSelect,
}) => {
  const styles = useStyles();

  return (
    <Nav className={styles.nav} openCategories={['pazaak', 'sabacc']}>
      {/* Pazaak Section */}
      <NavCategory value="pazaak">
        <NavCategoryItem icon={<CardUi24Regular />}>Pazaak</NavCategoryItem>
        <NavSubItem value="pazaak-vs-ai" onClick={() => onGameSelect('pazaak')}>
          Vs AI
        </NavSubItem>
        <NavSubItem value="pazaak-pvp" onClick={() => onGameSelect('pazaak-multiplayer')}>
          PvP
        </NavSubItem>
  <NavSubItem value="pazaak-rules" onClick={() => onGameSelect('pazaak-rules')}>
          Rules
        </NavSubItem>
      </NavCategory>

      {/* Sabacc Coming Soon Section */}
      <NavCategory value="sabacc">
        <NavCategoryItem icon={<Games24Regular />}>Sabacc (Coming Soon)</NavCategoryItem>
        <NavItem icon={<Group24Regular />} value="sabacc-placeholder" disabled>
          Variants In Development
        </NavItem>
      </NavCategory>

      {/* Info (Optional) - removed per cleanup; keep a minimal About link only if needed later */}
      {/* Removed Help & Info and About to declutter as requested */}
    </Nav>
  );
};

export default AppNavigation;
