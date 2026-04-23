import { Box, DropdownMenu, Flex, IconButton, Text } from "@radix-ui/themes";
import { FaBars, FaCircleUser } from "react-icons/fa6";

import { useAuth } from "@/shared/auth";
import { styles } from "./Header.styles";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();

  return (
    <Box asChild>
      <header style={styles.header}>
        <Flex style={styles.inner}>
          <Flex style={styles.leading}>
            <IconButton
              size="2"
              variant="ghost"
              radius="full"
              style={styles.menuButton}
              aria-label="Open navigation"
              onClick={onMenuClick}
            >
              <FaBars aria-hidden="true" style={styles.menuIcon} />
            </IconButton>
          </Flex>
          <Text as="span" style={styles.title}>
            Sample Front
          </Text>
          <Flex style={styles.trailing}>
            <DropdownMenu.Root>
              <DropdownMenu.Trigger>
                <IconButton
                  size="2"
                  variant="ghost"
                  radius="full"
                  style={styles.accountButton}
                  aria-label="Account"
                >
                  <FaCircleUser aria-hidden="true" style={styles.accountIcon} />
                </IconButton>
              </DropdownMenu.Trigger>
              <DropdownMenu.Content
                style={styles.dropdownContent}
                align="end"
                side="bottom"
                onCloseAutoFocus={(e) => e.preventDefault()}
              >
                <Box style={styles.dropdownItem}>
                  <Text as="p" style={styles.dropdownUuid}>
                    {user?.uuid}
                  </Text>
                  <Text as="p" style={styles.dropdownName}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                </Box>
              </DropdownMenu.Content>
            </DropdownMenu.Root>
          </Flex>
        </Flex>
      </header>
    </Box>
  );
}
