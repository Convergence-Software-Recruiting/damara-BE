import HttpStatusCodes from "../common/constants/HttpStatusCodes";
import { RouteError } from "../common/util/route-errors";
import PostExceptionModel, {
  PostExceptionCreationAttributes,
} from "../models/PostException";
import UserModel from "../models/User";
import { PostExceptionStatus } from "../types/post-exception";

const reporterInclude = {
  model: UserModel,
  as: "reporter",
  attributes: ["id", "nickname", "studentId", "department", "avatarUrl"],
};

export const PostExceptionRepo = {
  async create(data: PostExceptionCreationAttributes) {
    const postException = await PostExceptionModel.create(data);
    const created = await PostExceptionModel.findByPk(postException.id, {
      include: [reporterInclude],
    });

    return created ? created.get({ plain: true }) : postException.get();
  },

  async findByPostId(postId: string, limit = 20, offset = 0) {
    const exceptions = await PostExceptionModel.findAll({
      where: { postId },
      include: [reporterInclude],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
    });

    return exceptions.map((exception) => exception.get({ plain: true }));
  },

  async countByPostId(postId: string) {
    return await PostExceptionModel.count({
      where: { postId },
    });
  },

  async findById(id: string) {
    const postException = await PostExceptionModel.findByPk(id, {
      include: [reporterInclude],
    });

    return postException ? postException.get({ plain: true }) : null;
  },

  async findLatestOpenByPostId(postId: string) {
    const postException = await PostExceptionModel.findOne({
      where: { postId, status: "open" },
      include: [reporterInclude],
      order: [["createdAt", "DESC"]],
    });

    return postException ? postException.get({ plain: true }) : null;
  },

  async countOpenByPostId(postId: string) {
    return await PostExceptionModel.count({
      where: { postId, status: "open" },
    });
  },

  async updateStatus(
    id: string,
    status: PostExceptionStatus,
    resolutionNote?: string | null
  ) {
    const postException = await PostExceptionModel.findByPk(id);

    if (!postException) {
      throw new RouteError(
        HttpStatusCodes.NOT_FOUND,
        "POST_EXCEPTION_NOT_FOUND"
      );
    }

    postException.status = status;
    if (resolutionNote !== undefined) {
      postException.resolutionNote = resolutionNote;
    }
    await postException.save();

    return await this.findById(id);
  },
};
