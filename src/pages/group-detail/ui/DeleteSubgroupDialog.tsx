import { AlertDialog, Button, Flex, Text } from "@radix-ui/themes";

import { useDeleteSubgroup } from "@/pages/group-detail/model/useDeleteSubgroup";

type DeleteSubgroupDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: number;
  subgroupId: number | null;
  onSuccess: () => void;
};

export function DeleteSubgroupDialog({
  open,
  onOpenChange,
  groupId,
  subgroupId,
  onSuccess,
}: DeleteSubgroupDialogProps) {
  const { isLoading, error, deleteSubgroup, clearError } = useDeleteSubgroup();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (subgroupId === null) return;

    const success = await deleteSubgroup(groupId, subgroupId);
    if (success) {
      onOpenChange(false);
      onSuccess();
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      clearError();
    }
    onOpenChange(nextOpen);
  };

  return (
    <AlertDialog.Root open={open} onOpenChange={handleOpenChange}>
      <AlertDialog.Content maxWidth="480px">
        <AlertDialog.Title>Delete Subgroup</AlertDialog.Title>
        <AlertDialog.Description>
          Are you sure you want to delete this subgroup? This action cannot be undone.
        </AlertDialog.Description>

        {error && (
          <Text size="2" color="red" mt="2" as="p">
            {error}
          </Text>
        )}

        <Flex gap="3" mt="4" justify="end">
          <AlertDialog.Cancel>
            <Button variant="soft" color="gray" radius="full">
              Cancel
            </Button>
          </AlertDialog.Cancel>
          <AlertDialog.Action>
            <Button color="red" radius="full" disabled={isLoading} onClick={handleDelete}>
              Delete
            </Button>
          </AlertDialog.Action>
        </Flex>
      </AlertDialog.Content>
    </AlertDialog.Root>
  );
}
