import { useState } from "react";
import { useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useItem, useUpdateItem } from "@/hooks/use-items";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { generateItemReport } from "@/lib/pdf-utils";
import { updateItemSchema, type UpdateItem } from "@shared/schema";
import { z } from "zod";
import { useEffect } from "react";

const conditionOptions = [
  { value: "excellent", label: "Excellent" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
  { value: "poor", label: "Poor" },
];

const itemUpdateSchema = z.object({
  lastInspectionDate: z.string().optional(),
  conditionStatus: z.string().optional(),
  inspectionNotes: z.string().optional(),
});

type ItemUpdateForm = z.infer<typeof itemUpdateSchema>;

export default function ItemDetails() {
  const params = useParams();
  const itemId = params.id as string;
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  const { data: item, isLoading, error } = useItem(itemId);
  const updateItemMutation = useUpdateItem();
  const { toast } = useToast();

  const form = useForm<ItemUpdateForm>({
    resolver: zodResolver(itemUpdateSchema),
    defaultValues: {
      lastInspectionDate: item?.lastInspectionDate 
        ? new Date(item.lastInspectionDate).toISOString().split('T')[0] 
        : "",
      conditionStatus: item?.conditionStatus || "good",
      inspectionNotes: item?.inspectionNotes || "",
    },
  });

  // Update form when item data loads
  useEffect(() => {
    if (item) {
      form.reset({
        lastInspectionDate: item.lastInspectionDate 
          ? new Date(item.lastInspectionDate).toISOString().split('T')[0] 
          : "",
        conditionStatus: item.conditionStatus || "good",
        inspectionNotes: item.inspectionNotes || "",
      });
    }
  }, [item, form]);

  const onSubmit = async (data: ItemUpdateForm) => {
    const updateData: Partial<UpdateItem> = {};
    
    // Only include fields that have changed and are valid
    if (data.lastInspectionDate) {
      // Ensure we create a proper Date object from the string
      const inspectionDate = new Date(data.lastInspectionDate + 'T00:00:00.000Z');
      updateData.lastInspectionDate = inspectionDate;
    }
    if (data.conditionStatus) {
      updateData.conditionStatus = data.conditionStatus;
    }
    if (data.inspectionNotes !== undefined) {
      updateData.inspectionNotes = data.inspectionNotes || null;
    }

    try {
      await updateItemMutation.mutateAsync({ id: itemId, data: updateData as UpdateItem });
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDownloadQR = async () => {
    try {
      const qrData = await api.getQRCode(itemId);
      
      const link = document.createElement("a");
      link.href = qrData.qrCode;
      link.download = `qr-${itemId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "QR code downloaded successfully!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to download QR code",
        variant: "destructive",
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!item) return;
    
    setIsGeneratingReport(true);
    try {
      const aiSummary = await api.generateSummary({
        itemId: item.id,
        itemType: item.itemType,
        vendor: item.vendorName,
        supplyDate: item.supplyDate,
        warrantyPeriod: item.warrantyPeriod,
        lastInspection: item.lastInspectionDate,
        condition: item.conditionStatus,
      });

      await generateItemReport(item, aiSummary.summary);
      
      toast({
        title: "Success",
        description: "Report generated successfully!",
      });
    } catch (error) {
      await generateItemReport(item);
      toast({
        title: "Report Generated",
        description: "Report generated without AI summary",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <LoadingSpinner />
          <h1 className="text-3xl font-bold">Loading Item Details...</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="w-24 h-4 bg-muted rounded skeleton"></div>
                  <div className="w-32 h-4 bg-muted rounded skeleton"></div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="w-32 h-32 bg-muted rounded skeleton mx-auto"></div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Item Not Found</h1>
        <Card>
          <CardContent className="p-6 text-center">
            <i className="fas fa-exclamation-triangle text-4xl text-destructive mb-4"></i>
            <p className="text-lg mb-2">Item with ID "{itemId}" not found</p>
            <p className="text-muted-foreground">Please check the item ID and try again.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Item Details</h1>
          <p className="text-muted-foreground">Item ID: {item.id}</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleDownloadQR}
            variant="outline"
            data-testid="download-qr-button"
          >
            <i className="fas fa-download mr-2"></i>
            Download QR
          </Button>
          <Button
            onClick={handleGenerateReport}
            disabled={isGeneratingReport}
            data-testid="generate-report-button"
          >
            {isGeneratingReport ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Generating...
              </>
            ) : (
              <>
                <i className="fas fa-file-pdf mr-2"></i>
                Generate Report
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Basic Information */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Item ID</label>
                <p className="font-mono text-sm">{item.id}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Type</label>
                <p>{item.itemType}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Vendor</label>
                <p>{item.vendorName}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Supply Date</label>
                <p>{new Date(item.supplyDate).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Warranty Period</label>
                <p>{item.warrantyPeriod} months</p>
              </div>
              <div>
                <label className="block text-sm text-muted-foreground mb-1">Warranty Expiry</label>
                <p className={`${
                  new Date(item.warrantyExpiryDate!) < new Date() 
                    ? "text-destructive" 
                    : "text-foreground"
                }`}>
                  {new Date(item.warrantyExpiryDate!).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card>
          <CardHeader>
            <CardTitle>QR Code</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="w-32 h-32 bg-muted rounded-md flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-qrcode text-4xl text-muted-foreground"></i>
            </div>
            <Button 
              onClick={handleDownloadQR}
              className="w-full"
              variant="outline"
              data-testid="download-qr-card-button"
            >
              <i className="fas fa-download mr-2"></i>
              Download QR Code
            </Button>
          </CardContent>
        </Card>

        {/* Maintenance Information */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Maintenance Information</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="update-item-form">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="lastInspectionDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Inspection Date</FormLabel>
                        <FormControl>
                          <Input 
                            type="date" 
                            {...field} 
                            data-testid="input-inspection-date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="conditionStatus"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Condition Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-condition-status">
                              <SelectValue placeholder="Select condition" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {conditionOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
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
                  name="inspectionNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspection Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add inspection notes..." 
                          rows={3}
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-inspection-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit"
                    className="flex-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    disabled={updateItemMutation.isPending}
                    data-testid="update-item-button"
                  >
                    {updateItemMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save mr-2"></i>
                        Update Item
                      </>
                    )}
                  </Button>
                  <Button 
                    type="button"
                    variant="secondary"
                    className="flex-1"
                    onClick={handleGenerateReport}
                    disabled={isGeneratingReport}
                    data-testid="generate-report-form-button"
                  >
                    {isGeneratingReport ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-file-pdf mr-2"></i>
                        Generate Report
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
