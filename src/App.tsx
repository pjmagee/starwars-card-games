import { useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  makeStyles,
  tokens,
  Card,
  CardHeader,
  Text,
  Button,
  Menu,
  MenuTrigger,
  MenuPopover,
  MenuList,
  MenuItem,
  Divider,
  Body1,
  Title1,
  Badge,
} from '@fluentui/react-components';
import {
  Games24Regular,
  People24Regular,
  Settings24Regular,
  Bot24Regular,
  Group24Regular,
  Navigation24Regular,
} from '@fluentui/react-icons';
import PazaakGameLayout from './games/pazaak/PazaakGameLayout';
import AppNavigation from './components/AppNavigation';
import { NotificationProvider } from './components/NotificationSystem';
import { useNotifications } from './hooks/useNotifications';

type GameMode = 'menu' | 'pazaak' | 'pazaak-multiplayer' | 'sabacc-spike' | 'sabacc-kessel';
type SessionMode = 'offline' | 'host' | 'join';
type ViewMode = 'normal' | 'sidebar'; // New: toggle between normal and sidebar nav

const useStyles = makeStyles({
  appContainer: {
    display: 'flex',
    height: '100vh',
    width: '100vw',
    backgroundColor: tokens.colorNeutralBackground1,
  },
  sidebarLayout: {
    display: 'flex',
    height: '100vh',
  },
  normalLayout: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacingVerticalM,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  content: {
    flex: 1,
    overflow: 'hidden',
  },
  gameContent: {
    flex: 1,
    overflow: 'hidden',
    width: '100%',
    height: '100%',
  },
  contentWithSidebar: {
    flex: 1,
    padding: tokens.spacingVerticalM,
    overflow: 'hidden',
  },
  menuGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: tokens.spacingVerticalL,
    maxWidth: '1200px',
    margin: '0 auto',
    padding: tokens.spacingVerticalXL,
  },
  gameCard: {
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'scale(1.02)',
    },
  },
  gameTitle: {
    marginBottom: tokens.spacingVerticalS,
  },
  gameDescription: {
    marginBottom: tokens.spacingVerticalM,
  },
  gameActions: {
    display: 'flex',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  comingSoon: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    gap: tokens.spacingVerticalM,
  },
});

function App() {
  const styles = useStyles();
  const [currentGame, setCurrentGame] = useState<GameMode>('menu');
  const [sessionMode, setSessionMode] = useState<SessionMode>('offline');
  const [viewMode, setViewMode] = useState<ViewMode>('normal');

  const handleGameSelect = (game: GameMode) => {
    setCurrentGame(game);
  };

  const handleBackToMenu = () => {
    setCurrentGame('menu');
  };

  const handleShowRules = () => {
    // Will implement dialog for rules
    console.log('Show rules');
  };

  const handleShowAbout = () => {
    // Will implement dialog for about
    console.log('Show about');
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'normal' ? 'sidebar' : 'normal');
  };

  const AppContent = () => {
    const { showToast } = useNotifications();

    const renderGameMenu = () => (
      <div className={styles.menuGrid}>
        {/* Pazaak Game Card */}
        <Card className={styles.gameCard}>
          <CardHeader
            header={
              <div>
                <div className={styles.gameTitle}>
                  <Title1>Pazaak</Title1>
                  <Badge appearance="filled" color="success">Available</Badge>
                </div>
                <Body1 className={styles.gameDescription}>
                  Classic card game from Knights of the Old Republic. 
                  Reach exactly 20 points without going over using number cards and side deck modifiers.
                </Body1>
                <div className={styles.gameActions}>
                  <Button
                    appearance="primary"
                    icon={<Bot24Regular />}
                    onClick={() => {
                      handleGameSelect('pazaak');
                      showToast({
                        type: 'success',
                        title: 'Game Starting',
                        message: 'Loading Pazaak vs AI...'
                      });
                    }}
                  >
                    Play vs AI
                  </Button>
                  <Button
                    appearance="secondary"
                    icon={<Group24Regular />}
                    onClick={() => {
                      handleGameSelect('pazaak-multiplayer');
                      showToast({
                        type: 'success',
                        title: 'Multiplayer Starting',
                        message: 'Loading Pazaak Multiplayer...'
                      });
                    }}
                  >
                    Multiplayer
                  </Button>
                </div>
              </div>
            }
          />
        </Card>

        {/* Corellian Spike Sabacc Card */}
        <Card className={styles.gameCard}>
          <CardHeader
            header={
              <div>
                <div className={styles.gameTitle}>
                  <Title1>Corellian Spike Sabacc</Title1>
                  <Badge appearance="filled" color="warning">Coming Soon</Badge>
                </div>
                <Body1 className={styles.gameDescription}>
                  The variant seen in Solo and Galaxy's Edge. 
                  Use 62 cards to get closest to zero with positive and negative values.
                </Body1>
                <div className={styles.gameActions}>
                  <Button
                    icon={<Bot24Regular />}
                    disabled
                  >
                    Play vs AI
                  </Button>
                  <Button
                    icon={<Group24Regular />}
                    disabled
                  >
                    Multiplayer
                  </Button>
                </div>
              </div>
            }
          />
        </Card>

        {/* Kessel Sabacc Card */}
        <Card className={styles.gameCard}>
          <CardHeader
            header={
              <div>
                <div className={styles.gameTitle}>
                  <Title1>Kessel Sabacc</Title1>
                  <Badge appearance="filled" color="warning">Coming Soon</Badge>
                </div>
                <Body1 className={styles.gameDescription}>
                  Ubisoft variant inspired by Corellian Spike. 
                  Strategic gameplay with unique card mechanics and betting rounds.
                </Body1>
                <div className={styles.gameActions}>
                  <Button
                    icon={<Bot24Regular />}
                    disabled
                  >
                    Play vs AI
                  </Button>
                  <Button
                    icon={<Group24Regular />}
                    disabled
                  >
                    Multiplayer
                  </Button>
                </div>
              </div>
            }
          />
        </Card>
      </div>
    );

    const renderCurrentGame = () => {
      switch (currentGame) {
        case 'pazaak':
          return <PazaakGameLayout />;
        case 'pazaak-multiplayer':
          return <PazaakGameLayout initialMode="multiplayer" />;
        case 'sabacc-spike':
        case 'sabacc-kessel':
          return (
            <div className={styles.comingSoon}>
              <Text size={600}>Coming Soon!</Text>
              <Button onClick={handleBackToMenu}>Back to Menu</Button>
            </div>
          );
        default:
          return renderGameMenu();
      }
    };

    if (viewMode === 'sidebar' && currentGame === 'menu') {
      return (
        <div className={styles.sidebarLayout}>
          <AppNavigation
            currentGame={currentGame}
            onGameSelect={handleGameSelect}
            onShowRules={handleShowRules}
            onShowAbout={handleShowAbout}
          />
          <div className={styles.contentWithSidebar}>
            {renderCurrentGame()}
          </div>
        </div>
      );
    }

    return (
      <div className={styles.normalLayout}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <Games24Regular />
            <Title1>Star Wars Card Games</Title1>
            
            {/* Toggle sidebar view for menu */}
            {currentGame === 'menu' && (
              <Button
                icon={<Navigation24Regular />}
                appearance="subtle"
                onClick={toggleViewMode}
              >
                {viewMode === 'normal' ? 'Sidebar View' : 'Grid View'}
              </Button>
            )}
          </div>
          <div className={styles.headerRight}>
            {/* Session/Multiplayer Controls */}
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button 
                  icon={<People24Regular />}
                  disabled
                >
                  Session: {sessionMode === 'offline' ? 'Offline' : sessionMode === 'host' ? 'Hosting' : 'Connected'}
                </Button>
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem onClick={() => setSessionMode('offline')}>
                    Play Offline
                  </MenuItem>
                  <MenuItem onClick={() => setSessionMode('host')} disabled>
                    Host Game
                  </MenuItem>
                  <MenuItem onClick={() => setSessionMode('join')} disabled>
                    Join Game
                  </MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>

            {/* Settings Menu */}
            <Menu>
              <MenuTrigger disableButtonEnhancement>
                <Button icon={<Settings24Regular />} />
              </MenuTrigger>
              <MenuPopover>
                <MenuList>
                  <MenuItem disabled>Sound Effects</MenuItem>
                  <MenuItem disabled>Background Music</MenuItem>
                  <Divider />
                  <MenuItem onClick={handleShowRules}>Game Rules</MenuItem>
                  <MenuItem onClick={handleShowAbout}>About</MenuItem>
                </MenuList>
              </MenuPopover>
            </Menu>

            {/* Back to Menu (only show when in a game) */}
            {currentGame !== 'menu' && (
              <Button onClick={handleBackToMenu}>
                Back to Menu
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className={currentGame === 'menu' ? styles.content : styles.gameContent}>
          {renderCurrentGame()}
        </div>
      </div>
    );
  };

  return (
    <FluentProvider theme={webLightTheme}>
      <NotificationProvider>
        <div className={styles.appContainer}>
          <AppContent />
        </div>
      </NotificationProvider>
    </FluentProvider>
  );
}

export default App;
