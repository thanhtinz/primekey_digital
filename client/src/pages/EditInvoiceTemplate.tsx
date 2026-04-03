import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import DashboardLayout from "@/components/DashboardLayoutCustom";
import { useLocation } from "wouter";

export default function EditInvoiceTemplate() {
  const [, setLocation] = useLocation();
  const [templateData, setTemplateData] = useState({
    name: "Mẫu Chuẩn",
    description: "Mẫu hóa đơn chuẩn",
    companyName: "Công Ty ABC",
    companyAddress: "123 Đường XYZ, Thành Phố",
    companyPhone: "0123456789",
    companyEmail: "info@abc.com",
    companyTaxId: "0123456789",
    companyLogo: "",
    headerColor: "#1e40af",
    footerColor: "#f3f4f6",
    textColor: "#000000",
    accentColor: "#3b82f6",
    font: "Arial",
    fontSize: "12",
    showLogo: true,
    showTaxId: true,
    showFooter: true,
    footerText: "Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!",
  });

  const handleInputChange = (field: string, value: any) => {
    setTemplateData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    toast.success("Lưu mẫu thành công!");
  };

  const handlePreview = () => {
    toast.info("Xem trước mẫu hóa đơn");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/templates")}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Chỉnh Sửa Mẫu Hóa Đơn</h1>
              <p className="text-gray-600">Tùy chỉnh giao diện và nội dung mẫu hóa đơn</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePreview}>
              <Eye className="w-4 h-4 mr-2" />
              Xem Trước
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              Lưu Mẫu
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">Thông Tin Chung</TabsTrigger>
            <TabsTrigger value="company">Thông Tin Công Ty</TabsTrigger>
            <TabsTrigger value="design">Thiết Kế</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Mẫu</CardTitle>
                <CardDescription>Nhập tên và mô tả mẫu hóa đơn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Tên Mẫu</Label>
                  <Input
                    id="name"
                    value={templateData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nhập tên mẫu"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Mô Tả</Label>
                  <Input
                    id="description"
                    value={templateData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    placeholder="Nhập mô tả mẫu"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thông Tin Công Ty</CardTitle>
                <CardDescription>Cấu hình thông tin công ty hiển thị trên hóa đơn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="companyName">Tên Công Ty</Label>
                  <Input
                    id="companyName"
                    value={templateData.companyName}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                    placeholder="Nhập tên công ty"
                  />
                </div>
                <div>
                  <Label htmlFor="companyAddress">Địa Chỉ</Label>
                  <Input
                    id="companyAddress"
                    value={templateData.companyAddress}
                    onChange={(e) => handleInputChange("companyAddress", e.target.value)}
                    placeholder="Nhập địa chỉ"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyPhone">Số Điện Thoại</Label>
                    <Input
                      id="companyPhone"
                      value={templateData.companyPhone}
                      onChange={(e) => handleInputChange("companyPhone", e.target.value)}
                      placeholder="Nhập số điện thoại"
                    />
                  </div>
                  <div>
                    <Label htmlFor="companyEmail">Email</Label>
                    <Input
                      id="companyEmail"
                      value={templateData.companyEmail}
                      onChange={(e) => handleInputChange("companyEmail", e.target.value)}
                      placeholder="Nhập email"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="companyTaxId">Mã Số Thuế</Label>
                  <Input
                    id="companyTaxId"
                    value={templateData.companyTaxId}
                    onChange={(e) => handleInputChange("companyTaxId", e.target.value)}
                    placeholder="Nhập mã số thuế"
                  />
                </div>
                <div>
                  <Label htmlFor="companyLogo">URL Logo</Label>
                  <Input
                    id="companyLogo"
                    value={templateData.companyLogo}
                    onChange={(e) => handleInputChange("companyLogo", e.target.value)}
                    placeholder="Nhập URL logo"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Thiết Kế</CardTitle>
                <CardDescription>Tùy chỉnh màu sắc, font chữ</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="headerColor">Màu Header</Label>
                    <div className="flex gap-2">
                      <Input
                        id="headerColor"
                        type="color"
                        value={templateData.headerColor}
                        onChange={(e) => handleInputChange("headerColor", e.target.value)}
                        className="w-12 h-10"
                      />
                      <Input
                        value={templateData.headerColor}
                        onChange={(e) => handleInputChange("headerColor", e.target.value)}
                        placeholder="#1e40af"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="accentColor">Màu Accent</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={templateData.accentColor}
                        onChange={(e) => handleInputChange("accentColor", e.target.value)}
                        className="w-12 h-10"
                      />
                      <Input
                        value={templateData.accentColor}
                        onChange={(e) => handleInputChange("accentColor", e.target.value)}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="textColor">Màu Chữ</Label>
                    <div className="flex gap-2">
                      <Input
                        id="textColor"
                        type="color"
                        value={templateData.textColor}
                        onChange={(e) => handleInputChange("textColor", e.target.value)}
                        className="w-12 h-10"
                      />
                      <Input
                        value={templateData.textColor}
                        onChange={(e) => handleInputChange("textColor", e.target.value)}
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="footerColor">Màu Footer</Label>
                    <div className="flex gap-2">
                      <Input
                        id="footerColor"
                        type="color"
                        value={templateData.footerColor}
                        onChange={(e) => handleInputChange("footerColor", e.target.value)}
                        className="w-12 h-10"
                      />
                      <Input
                        value={templateData.footerColor}
                        onChange={(e) => handleInputChange("footerColor", e.target.value)}
                        placeholder="#f3f4f6"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="font">Font Chữ</Label>
                    <select
                      id="font"
                      value={templateData.font}
                      onChange={(e) => handleInputChange("font", e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                    >
                      <option>Arial</option>
                      <option>Times New Roman</option>
                      <option>Courier New</option>
                      <option>Verdana</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="fontSize">Kích Thước Font</Label>
                    <Input
                      id="fontSize"
                      type="number"
                      value={templateData.fontSize}
                      onChange={(e) => handleInputChange("fontSize", e.target.value)}
                      placeholder="12"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Footer</CardTitle>
                <CardDescription>Cấu hình footer hiển thị trên hóa đơn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="showFooter"
                    checked={templateData.showFooter}
                    onChange={(e) => handleInputChange("showFooter", e.target.checked)}
                  />
                  <Label htmlFor="showFooter">Hiển Thị Footer</Label>
                </div>
                {templateData.showFooter && (
                  <div>
                    <Label htmlFor="footerText">Nội Dung Footer</Label>
                    <textarea
                      id="footerText"
                      value={templateData.footerText}
                      onChange={(e) => handleInputChange("footerText", e.target.value)}
                      placeholder="Nhập nội dung footer"
                      className="w-full px-3 py-2 border rounded-md min-h-20"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
