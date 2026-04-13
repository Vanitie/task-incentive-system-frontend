<template>
  <div>
    <el-card>
      <el-row>
        <el-input
          v-model="search.name"
          placeholder="徽章名称"
          style="width: 200px; margin-right: 8px"
        />
        <el-button type="primary" @click="fetchData">搜索</el-button>
        <el-button @click="resetSearch">重置</el-button>
        <el-button @click="openDialog">新增徽章</el-button>
      </el-row>
      <el-table v-loading="loading" :data="tableData" style="margin-top: 16px">
        <el-table-column prop="name" label="徽章名称" />
        <el-table-column prop="code" label="徽章标识" />
        <el-table-column prop="imageUrl" label="图片">
          <template #default="scope">
            <el-image
              :src="scope.row.imageUrl"
              style="width: 40px; height: 40px"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column label="创建时间" min-width="170">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="更新时间" min-width="170">
          <template #default="scope">
            {{ formatDateTime(scope.row.updateTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="editBadge(scope.row)"
              >编辑</el-button
            >
            <el-button
              size="small"
              type="danger"
              @click="deleteBadge(scope.row.id)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page.current"
        v-model:page-size="page.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="page.total"
        layout="total, sizes, prev, pager, next, jumper"
        style="margin-top: 16px; justify-content: flex-end"
        @current-change="fetchData"
        @size-change="handleSizeChange"
      />
    </el-card>
    <el-dialog v-model="dialogVisible" title="徽章管理" width="500px">
      <el-form :model="form">
        <el-form-item label="徽章名称">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="徽章标识">
          <el-input v-model="form.code" type="number" />
        </el-form-item>
        <el-form-item label="图片来源">
          <el-radio-group v-model="imageMode">
            <el-radio-button label="url">URL</el-radio-button>
            <el-radio-button label="upload">上传文件</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="imageMode === 'url'" label="图片URL">
          <el-input
            v-model="form.imageUrl"
            placeholder="https://example.com/badge.png"
          />
        </el-form-item>
        <el-form-item v-else label="上传图片">
          <el-upload
            :auto-upload="false"
            :limit="1"
            :show-file-list="true"
            :on-change="onFileChange"
            :on-remove="onFileRemove"
            accept="image/*"
          >
            <el-button type="primary">选择图片</el-button>
            <template #tip>
              <div class="el-upload__tip">支持 jpg/png/webp，保存时上传</div>
            </template>
          </el-upload>
          <el-input
            v-if="form.imageUrl"
            v-model="form.imageUrl"
            readonly
            style="margin-top: 8px"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import type { UploadFile } from "element-plus";
import {
  createBadge,
  deleteBadge as deleteBadgeApi,
  getBadgeList,
  searchBadgeByName,
  uploadBadgeImage,
  updateBadge,
  type BadgeItem
} from "@/api/badge";

const search = ref({ name: "" });
const loading = ref(false);
const tableData = ref<BadgeItem[]>([]);
const page = ref({
  current: 1,
  size: 20,
  total: 0
});
const dialogVisible = ref(false);
const imageMode = ref<"url" | "upload">("url");
const selectedImageFile = ref<File | null>(null);
const form = ref({
  id: undefined as number | undefined,
  name: "",
  code: 0,
  imageUrl: "",
  description: ""
});

function unwrapData<T>(payload: T | { data?: T }): T {
  if (payload && typeof payload === "object" && "data" in payload) {
    return ((payload as { data?: T }).data ?? payload) as T;
  }
  return payload as T;
}

async function fetchData() {
  loading.value = true;
  try {
    const params = {
      page: page.value.current,
      size: page.value.size
    };
    const response = search.value.name.trim()
      ? await searchBadgeByName({ ...params, name: search.value.name.trim() })
      : await getBadgeList(params);
    const data = unwrapData(response);
    tableData.value = data?.items || [];
    page.value.total = Number(data?.total || 0);
  } catch {
    ElMessage.error("加载徽章列表失败");
  } finally {
    loading.value = false;
  }
}

function resetSearch() {
  search.value.name = "";
  page.value.current = 1;
  fetchData();
}

function handleSizeChange() {
  page.value.current = 1;
  fetchData();
}

function openDialog() {
  imageMode.value = "url";
  selectedImageFile.value = null;
  form.value = {
    id: undefined,
    name: "",
    code: 0,
    imageUrl: "",
    description: ""
  };
  dialogVisible.value = true;
}
function editBadge(row: any) {
  form.value = { ...row };
  imageMode.value = "url";
  selectedImageFile.value = null;
  dialogVisible.value = true;
}

function onFileChange(file: UploadFile) {
  selectedImageFile.value = (file.raw as File) || null;
}

function onFileRemove() {
  selectedImageFile.value = null;
}

function formatDateTime(value?: string) {
  if (!value) return "-";
  const normalized = String(value)
    .replace("T", " ")
    .replace(/\.\d+\+00:00$/, "");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return normalized;
  }
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

async function deleteBadge(id: number) {
  try {
    await ElMessageBox.confirm("确认删除该徽章吗？", "删除确认", {
      type: "warning",
      confirmButtonText: "确认",
      cancelButtonText: "取消"
    });
    await deleteBadgeApi(id);
    ElMessage.success("删除成功");
    if (tableData.value.length === 1 && page.value.current > 1) {
      page.value.current -= 1;
    }
    fetchData();
  } catch {
    // 用户取消或请求失败
  }
}

async function submitForm() {
  if (!form.value.name.trim()) {
    ElMessage.warning("请填写徽章名称");
    return;
  }

  if (imageMode.value === "url" && !form.value.imageUrl?.trim()) {
    ElMessage.warning("请填写图片URL或切换为上传文件");
    return;
  }

  if (imageMode.value === "upload" && !selectedImageFile.value) {
    ElMessage.warning("请先选择图片文件");
    return;
  }

  try {
    let imageUrl = form.value.imageUrl?.trim() || "";
    if (imageMode.value === "upload" && selectedImageFile.value) {
      const uploadRes = await uploadBadgeImage(selectedImageFile.value);
      const uploadData = unwrapData(uploadRes);
      imageUrl = typeof uploadData === "string" ? uploadData : "";
      if (!imageUrl) {
        ElMessage.error("图片上传失败，请重试");
        return;
      }
    }

    const payload: BadgeItem = {
      ...(form.value.id ? { id: form.value.id } : {}),
      name: form.value.name.trim(),
      code: Number(form.value.code || 0),
      imageUrl,
      description: form.value.description?.trim() || ""
    };

    if (form.value.id) {
      await updateBadge(payload);
      ElMessage.success("更新成功");
    } else {
      await createBadge(payload);
      ElMessage.success("新增成功");
    }
    dialogVisible.value = false;
    selectedImageFile.value = null;
    fetchData();
  } catch {
    ElMessage.error(form.value.id ? "更新失败" : "新增失败");
  }
}

onMounted(fetchData);
</script>
