"use client";

import { Button } from "@repo/ui/components/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui/components/card";
import { Input } from "@repo/ui/components/input";
import { Label } from "@repo/ui/components/label";
import { useUserInfo } from "@/app/hooks/useUser";
import { BASE_URL, sendZippedFile } from "@/app/config/utils";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import {
  User,
  KeyRound,
  Save,
  Check,
  Eye,
  EyeOff,
  Camera,
  X,
  Loader2,
  Plus,
} from "lucide-react";

const MAX_SKILLS = 10;

export default function SettingsPage() {
  const user = useUserInfo();
  const username = user.data?.username ?? "you";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    axios
      .get(`${BASE_URL}/api/profile/me`, { withCredentials: true })
      .then((res) => {
        if (!active) return;
        const u = res.data?.user;
        setDescription(u?.description ?? "");
        setLocation(u?.location ?? "");
        setSkills(u?.skills ?? []);
        setCurrentImage(u?.imageUrl ?? null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const addSkill = () => {
    const value = skillInput.trim();
    if (!value) return;
    if (skills.length >= MAX_SKILLS) return;
    if (skills.some((s) => s.toLowerCase() === value.toLowerCase())) {
      setSkillInput("");
      return;
    }
    setSkills((prev) => [...prev, value]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    setSkills((prev) => prev.filter((s) => s !== skill));
  };

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be smaller than 5MB.");
      return;
    }
    setError("");
    setNewImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    if (e.target) e.target.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      let imageUrl: string | undefined;

      if (newImage) {
        const upRes = await axios.get(`${BASE_URL}/api/profile/avatar/upload-url`, {
          withCredentials: true,
        });
        const { url, method, fields, headers, publicUrl } = upRes.data;
        await sendZippedFile(url, method, fields, headers, newImage);
        imageUrl = publicUrl;
      }

      await axios.patch(
        `${BASE_URL}/api/profile/me`,
        {
          description,
          location,
          skills,
          ...(imageUrl ? { imageUrl } : {}),
        },
        { withCredentials: true }
      );

      if (imageUrl) setCurrentImage(imageUrl);
      setNewImage(null);
      setPreviewUrl(null);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      console.error("failed to save profile", err);
      setError("Something went wrong while saving. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayImage = previewUrl ?? currentImage;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account and profile.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" /> Profile
          </CardTitle>
          <CardDescription>Your public information shown on your profile page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative group w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-muted text-foreground font-bold text-2xl ring-2 ring-background border border-border shrink-0 cursor-pointer"
              aria-label="Upload profile picture"
            >
              {displayImage ? (
                <img src={displayImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span>{username.charAt(0).toUpperCase()}</span>
              )}
              <span className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="h-6 w-6 text-white" />
              </span>
            </button>
            <div className="flex flex-col gap-1">
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                Change Photo
              </Button>
              {newImage && (
                <span className="text-xs text-muted-foreground">New photo selected</span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onFileSelected}
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="display-name">Display Name</Label>
              <Input id="display-name" value={username} disabled />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="City, Country"
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Input
                id="bio"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell others about yourself..."
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Skills ({skills.length}/{MAX_SKILLS})</Label>
            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Type a skill and press Enter"
                disabled={skills.length >= MAX_SKILLS}
              />
              <Button type="button" variant="outline" size="sm" onClick={addSkill} disabled={skills.length >= MAX_SKILLS || !skillInput.trim()}>
                <Plus className="h-4 w-4" /> Add
              </Button>
            </div>
            {skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-sm text-foreground"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="text-muted-foreground hover:text-foreground"
                      aria-label={`Remove ${skill}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {skills.length >= MAX_SKILLS && (
              <p className="text-xs text-muted-foreground">Maximum of {MAX_SKILLS} skills reached.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-muted-foreground" /> Security
          </CardTitle>
          <CardDescription>Keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <Input id="current-password" type={showPassword ? "text" : "password"} />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="Toggle current password visibility"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <div className="relative">
                <Input id="new-password" type={showConfirm ? "text" : "password"} />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  aria-label="Toggle new password visibility"
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col items-end gap-2">
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex items-center gap-3">
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <Check className="h-4 w-4" /> Saved
            </span>
          )}
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
