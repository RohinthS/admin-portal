import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TestsService } from './tests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard)
@Controller('tests')
export class TestsController {
  constructor(private readonly testsService: TestsService) {}

  // ==========================================
  // 1. ASSESSMENT / QUESTION SET ENDPOINTS
  // ==========================================

  @Get('sets')
  getQuestionSets(
    @Query('course_id') courseId?: string,
    @Query('category') category?: string,
    @Query('publishing_mode') publishingMode?: string,
    @Query('search') search?: string,
  ): Promise<any[]> {
    return this.testsService.getQuestionSets({
      course_id: courseId,
      category,
      publishing_mode: publishingMode,
      search,
    });
  }

  @Get('sets/:id')
  getQuestionSetById(@Param('id') id: string): Promise<any> {
    return this.testsService.getQuestionSetById(id);
  }

  @Post('sets')
  createQuestionSet(@Body() data: any, @CurrentUser() user: any) {
    return this.testsService.createQuestionSet(data, user);
  }

  @Put('sets/:id')
  @Patch('sets/:id')
  updateQuestionSet(@Param('id') id: string, @Body() data: any) {
    return this.testsService.updateQuestionSet(id, data);
  }

  @Delete('sets/:id')
  deleteQuestionSet(@Param('id') id: string) {
    return this.testsService.deleteQuestionSet(id);
  }

  // Answer Key Permission Control: Admin/Mentor grants or revokes examinee solution access
  @Patch('sets/:id/release-answer-key')
  setAnswerKeyRelease(
    @Param('id') id: string,
    @Body('released') released: boolean,
    @CurrentUser() user: any,
  ) {
    return this.testsService.setAnswerKeyRelease(id, released, user);
  }

  // ==========================================
  // 2. QUESTION BANK & QUESTIONS ENDPOINTS
  // ==========================================

  @Get('questions')
  getQuestionBank(
    @Query('setId') setId?: string,
    @Query('courseId') courseId?: string,
    @Query('topic') topic?: string,
    @Query('difficulty') difficulty?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.testsService.getQuestions({
      setId,
      courseId,
      topic,
      difficulty,
      type,
      search,
    });
  }

  @Get('sets/:setId/questions')
  getQuestionsForSet(@Param('setId') setId: string) {
    return this.testsService.getQuestions({ setId });
  }

  @Post('questions')
  createQuestion(@Body() data: any) {
    return this.testsService.createQuestion(data);
  }

  @Post('questions/bulk')
  createQuestionsBulk(
    @Body('questions') questions: any[],
    @Body('setId') setId?: string,
  ) {
    return this.testsService.createQuestionsBulk(questions, setId);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.testsService.deleteQuestion(id);
  }

  // ==========================================
  // 3. STUDENT EXAMINATION LIFECYCLE
  // ==========================================

  @Post('sets/:setId/start')
  startTest(
    @Param('setId') setId: string,
    @Body('secret_key') secretKey: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.testsService.startTest(user.sub, setId, secretKey, user);
  }

  @Post('attempts/:attemptId/violation')
  logViolation(
    @Param('attemptId') attemptId: string,
    @Body() violation: { type: string; description: string },
  ) {
    return this.testsService.logViolation(attemptId, violation);
  }

  @Post('attempts/:attemptId/submit')
  submitTest(
    @Param('attemptId') attemptId: string,
    @Body('answers') answers: Array<{ question_id: string; selected_option: any }>,
    @Body('disqualified') disqualified?: boolean,
  ) {
    return this.testsService.submitTest(attemptId, answers, disqualified);
  }

  @Get('attempts/:attemptId/scorecard')
  getScorecard(
    @Param('attemptId') attemptId: string,
    @CurrentUser() user: any,
  ): Promise<any> {
    return this.testsService.getScorecardWithPermissionCheck(attemptId, user);
  }

  @Get('my-results')
  getMyResults(@CurrentUser() user: any) {
    return this.testsService.getStudentResults(user.sub);
  }

  // ==========================================
  // 4. ANALYTICS & LIVE PROCTORING
  // ==========================================

  @Get('sets/:setId/analytics')
  getExamAnalytics(@Param('setId') setId: string) {
    return this.testsService.getExamAnalytics(setId);
  }

  @Get('live-proctoring')
  getLiveProctoring() {
    return this.testsService.getLiveProctoring();
  }
}
