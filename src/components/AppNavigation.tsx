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
  Bot24Regular,
  Group24Regular,
  Settings24Regular,
  Info24Regular,
} from '@fluentui/react-icons';

interface AppNavigationProps {
  currentGame: string;
  onGameSelect: (game: 'menu' | 'pazaak' | 'pazaak-multiplayer' | 'sabacc-spike' | 'sabacc-kessel') => void;
  onShowRules: () => void;
  onShowAbout: () => void;
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
  onShowRules,
  onShowAbout 
}) => {
  const styles = useStyles();

  return (
    <Nav className={styles.nav} openCategories={['games', 'help']}>
      <NavCategory value="games">
        <NavCategoryItem icon={<Games24Regular />}>Games</NavCategoryItem>
        
        <NavItem 
          icon={<CardUi24Regular />} 
          value="pazaak"
          onClick={() => onGameSelect('pazaak')}
        >
          Pazaak
        </NavItem>
        
        <NavSubItem value="pazaak-vs-ai" onClick={() => onGameSelect('pazaak')}>
          vs AI
        </NavSubItem>
        
        <NavSubItem value="pazaak-practice" disabled>
          Practice Mode
        </NavSubItem>
        
        <NavSubItem value="pazaak-multiplayer" onClick={() => onGameSelect('pazaak-multiplayer')}>
          Multiplayer
        </NavSubItem>
        
        <NavItem 
          icon={<Bot24Regular />} 
          value="sabacc-spike"
          disabled
        >
          Corellian Spike Sabacc
        </NavItem>
        
        <NavItem 
          icon={<Group24Regular />} 
          value="sabacc-kessel"
          disabled
        >
          Kessel Sabacc
        </NavItem>
      </NavCategory>

      <NavCategory value="help">
        <NavCategoryItem icon={<Info24Regular />}>Help & Info</NavCategoryItem>
        
        <NavItem 
          icon={<Info24Regular />} 
          value="rules"
          onClick={onShowRules}
        >
          Game Rules
        </NavItem>
        
        <NavItem 
          icon={<Settings24Regular />} 
          value="about"
          onClick={onShowAbout}
        >
          About
        </NavItem>
      </NavCategory>
    </Nav>
  );
};

export default AppNavigation;
