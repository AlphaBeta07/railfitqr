import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import type { BatchItemCreation, UpdateItem } from "@shared/schema";

export function useItems() {
  return useQuery({
    queryKey: ["/api/items"],
    queryFn: api.getItems,
  });
}

export function useItem(id: string) {
  return useQuery({
    queryKey: ["/api/items", id],
    queryFn: () => api.getItem(id),
    enabled: !!id,
  });
}

export function useCreateItems() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (data: BatchItemCreation) => api.createItems(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: `${data.count} items created successfully!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create items",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateItem() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItem }) => 
      api.updateItem(id, data),
    onSuccess: (updatedItem) => {
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/items", updatedItem.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Success",
        description: "Item updated successfully!",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["/api/stats"],
    queryFn: api.getStats,
  });
}

export function useVendors() {
  return useQuery({
    queryKey: ["/api/vendors"],
    queryFn: api.getVendors,
  });
}
