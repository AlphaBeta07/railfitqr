import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCreateItems } from "@/hooks/use-items";
import { downloadQRCodesAsZip } from "@/lib/qr-utils";
import { batchItemCreationSchema, type BatchItemCreation } from "@shared/schema";
import type { Item } from "@shared/schema";

const itemTypes = [
  { value: "wooden-sleeper", label: "Wooden Sleeper" },
  { value: "concrete-sleeper", label: "Concrete Sleeper" },
  { value: "rail-liner", label: "Rail Liner" },
  { value: "rail-pad", label: "Rail Pad" },
  { value: "elastic-rail-clip", label: "Elastic Rail Clip" },
];

const warrantyPeriods = [
  { value: 12, label: "12 months" },
  { value: 18, label: "18 months" },
  { value: 24, label: "24 months" },
  { value: 36, label: "36 months" },
  { value: 48, label: "48 months" },
];

export default function AddItems() {
  const [createdItems, setCreatedItems] = useState<Item[]>([]);
  const createItemsMutation = useCreateItems();

  const form = useForm<BatchItemCreation>({
    resolver: zodResolver(batchItemCreationSchema),
    defaultValues: {
      itemType: "",
      vendorName: "",
      supplyDate: "",
      warrantyPeriod: 24,
      quantity: 1,
    },
  });

  const onSubmit = async (data: BatchItemCreation) => {
    try {
      const result = await createItemsMutation.mutateAsync(data);
      setCreatedItems(result.items);
      form.reset();
    } catch (error) {
      console.error("Failed to create items:", error);
    }
  };

  const handleDownloadAllQRs = async () => {
    try {
      await downloadQRCodesAsZip(createdItems);
    } catch (error) {
      console.error("Failed to download QR codes:", error);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Add Track Fittings</h1>
        <p className="text-muted-foreground">Create new items with batch QR code generation</p>
      </div>

      <div className="max-w-2xl">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Item Creation Form</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="add-items-form">
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-item-type">
                            <SelectValue placeholder="Select item type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {itemTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendorName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vendor Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter vendor name" 
                          {...field} 
                          data-testid="input-vendor-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="supplyDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supply Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-supply-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="warrantyPeriod"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Warranty Period</FormLabel>
                        <Select onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-warranty-period">
                              <SelectValue placeholder="Select warranty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {warrantyPeriods.map((period) => (
                              <SelectItem key={period.value} value={period.value.toString()}>
                                {period.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter quantity" 
                          min="1" 
                          max="1000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          data-testid="input-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={createItemsMutation.isPending}
                  data-testid="submit-create-items"
                >
                  {createItemsMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Creating Items...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-plus mr-2"></i>
                      Create Items & Generate QR Codes
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* QR Code Results */}
        {createdItems.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Generated QR Codes</CardTitle>
                <Button 
                  onClick={handleDownloadAllQRs}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-testid="download-all-qrs"
                >
                  <i className="fas fa-download mr-2"></i>
                  Download All as ZIP
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {createdItems.map((item) => (
                  <div 
                    key={item.id} 
                    className="text-center p-4 border border-border rounded-lg hover:shadow-md transition-shadow"
                    data-testid={`qr-result-${item.id}`}
                  >
                    <div className="w-24 h-24 bg-muted mx-auto mb-2 rounded-md flex items-center justify-center">
                      <i className="fas fa-qrcode text-2xl text-muted-foreground"></i>
                    </div>
                    <p className="text-xs font-mono">{item.id}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
